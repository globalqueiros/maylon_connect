"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type VehicleBrand = { id: string; name: string };
type VehicleCategory = { id: string; name: string; description?: string; image?: string; type?: string; is_active?: number };
type VehicleModel = { id: string; name: string; brand_id?: string };
type Status = "pending" | "approved" | "rejected";
type AlertType = "success" | "error" | "info";
type AlertState = { show: boolean; message: string; type: AlertType };

type Veiculo = {
  id: string | number;
  brand_id: string;
  model_id: string;
  category_id: string;
  licence_plate_number: string;
  licence_expire_date: string;
  vin_number: string;
  transmission: string;
  parcel_weight_capacity: number;
  fuel_type: string;
  ownership: string;
  driver_id: string;
  is_active: number;
  draft: number | null;
  vehicle_request_status: Status;
  deny_note: string | null;
  created_at: string;
  updated_at: string;
  brand_name?: string | null;
  model_name?: string | null;
  category_name?: string | null;
  category_image?: string | null;
  model_image?: string | null;
};

type FormVeiculo = {
  brand_id: string;
  model_id: string;
  category_id: string;
  license_plate_number: string;
  license_expire_date: string;
  vin_number: string;
  transmission: string;
  parcel_weight_capacity: string;
  fuel_type: string;
  ownership: string;
};

const formularioInicial: FormVeiculo = {
  brand_id: "",
  model_id: "",
  category_id: "",
  license_plate_number: "",
  license_expire_date: "",
  vin_number: "",
  transmission: "AMT",
  parcel_weight_capacity: "",
  fuel_type: "gasolina",
  ownership: "driver",
};

const IMAGE_BASE_MODEL = "https://auth.maylon.com.br/storage/app/public/vehicle/model";
const IMAGE_BASE_CATEGORY = "https://auth.maylon.com.br/storage/app/public/vehicle/category";

function formatarData(data?: string | null) {
  if (!data) return "-";
  return data.slice(0, 10).split("-").reverse().join("/");
}

function urlImagem(caminho: string | null | undefined, base: string) {
  if (!caminho) return null;
  if (/^(https?:)?\/\//.test(caminho) || caminho.startsWith("data:")) return caminho;
  return `${base}/${caminho.replace(/^\/+/, "")}`;
}

function ImagemVeiculo({ fontes, alt }: { fontes: (string | null)[]; alt: string }) {
  const lista = fontes.filter((fonte): fonte is string => Boolean(fonte));
  const [indice, setIndice] = useState(0);
  const url = lista[indice];

  return (
    <div className="flex h-[50px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-xl">
      {url ? (
        <img
          key={url}
          src={url}
          alt={alt}
          loading="lazy"
          onError={() => {
            setIndice((atual) => atual + 1);
          }}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        "🚙"
      )}
    </div>
  );
}

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategory[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | Status>("todos");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormVeiculo>(formularioInicial);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<Veiculo | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    message: "",
    type: "info",
  });

  function mostrarAlert(message: string, type: AlertType = "info") {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: "", type: "info" });
    }, 3500);
  }

  function fecharAlert() {
    setAlert({ show: false, message: "", type: "info" });
  }

  async function carregarVeiculos() {
    try {
      setCarregando(true);
      const response = await fetch("/api/vehicles", {
        method: "GET",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Erro ao carregar veículos.");
      setVeiculos(data.vehicles || []);
    } catch (error) {
      console.error(error);
      mostrarAlert(error instanceof Error ? error.message : "Erro ao carregar veículos.", "error");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVeiculos();
  }, []);

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const response = await fetch("/api/vehicle-categories", { cache: "no-store" });
        if (!response.ok) throw new Error("Erro ao buscar categorias");
        const data = await response.json();
        setVehicleCategories(data.categories ?? []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setVehicleCategories([]);
      }
    };

    carregarCategorias();
  }, []);

  useEffect(() => {
    const carregarMarcas = async () => {
      try {
        const response = await fetch("/api/vehicle-brands", { cache: "no-store" });
        if (!response.ok) throw new Error("Erro ao buscar marcas");
        const data = await response.json();
        setVehicleBrands(data.brands ?? []);
      } catch (error) {
        console.error("Erro ao carregar marcas:", error);
        setVehicleBrands([]);
      }
    };

    carregarMarcas();
  }, []);

  useEffect(() => {
    if (!form.brand_id) {
      setVehicleModels([]);
      return;
    }

    let ativo = true;

    const carregarModelos = async () => {
      try {
        setCarregandoModelos(true);
        const response = await fetch(
          `/api/vehicle-models?brand_id=${encodeURIComponent(form.brand_id)}`,
          { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Erro ao buscar modelos");

        const data = await response.json();
        if (!ativo) return;

        const lista: VehicleModel[] = data.models ?? [];

        setVehicleModels(
          lista.filter(
            (model) => !model.brand_id || String(model.brand_id) === String(form.brand_id)
          )
        );
      } catch (error) {
        console.error("Erro ao carregar modelos:", error);
        if (ativo) setVehicleModels([]);
      } finally {
        if (ativo) setCarregandoModelos(false);
      }
    };

    carregarModelos();

    return () => {
      ativo = false;
    };
  }, [form.brand_id]);

  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((veiculo) => {
      const termo = busca.toLowerCase().trim();
      const texto = `
        ${veiculo.licence_plate_number ?? ""}
        ${veiculo.vin_number ?? ""}
        ${veiculo.brand_name ?? ""}
        ${veiculo.model_name ?? ""}
        ${veiculo.category_name ?? ""}
        ${veiculo.fuel_type ?? ""}
        ${veiculo.transmission ?? ""}
        ${veiculo.ownership ?? ""}
      `.toLowerCase();

      const encontrouBusca = texto.includes(termo);
      const encontrouStatus =
        statusFiltro === "todos" || veiculo.vehicle_request_status === statusFiltro;

      return encontrouBusca && encontrouStatus;
    });
  }, [veiculos, busca, statusFiltro]);

  function abrirModalCadastro() {
    if (
      veiculos.length > 0 &&
      !veiculos.every((veiculo) => veiculo.vehicle_request_status === "rejected")
    ) {
      mostrarAlert("Você já possui um veículo cadastrado.", "info");
      return;
    }

    setForm(formularioInicial);
    setVehicleModels([]);
    setModalAberto(true);
  }

  function fecharModalCadastro() {
    if (salvando) return;
    setModalAberto(false);
    setForm(formularioInicial);
    setVehicleModels([]);
  }

  function alterarCampo(campo: keyof FormVeiculo, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function alterarMarca(brandId: string) {
    setForm((atual) => ({
      ...atual,
      brand_id: brandId,
      model_id: "",
    }));
  }

  async function cadastrarVeiculo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.brand_id ||
      !form.model_id ||
      !form.category_id ||
      !form.license_plate_number ||
      !form.license_expire_date ||
      !form.vin_number ||
      !form.transmission ||
      !form.fuel_type ||
      !form.ownership ||
      !form.parcel_weight_capacity
    ) {
      mostrarAlert("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {
      setSalvando(true);

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_id: form.brand_id,
          model_id: form.model_id,
          category_id: form.category_id,
          licence_plate_number: form.license_plate_number,
          license_expire_date: form.license_expire_date,
          vin_number: form.vin_number,
          transmission: form.transmission,
          parcel_weight_capacity: Number(form.parcel_weight_capacity),
          fuel_type: form.fuel_type,
          ownership: form.ownership,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Não foi possível cadastrar o veículo.");
      }

      setModalAberto(false);
      setForm(formularioInicial);
      setVehicleModels([]);
      await carregarVeiculos();
      mostrarAlert("Veículo cadastrado e enviado para aprovação da equipe.", "success");
    } catch (error) {
      console.error(error);
      mostrarAlert(
        error instanceof Error ? error.message : "Erro ao cadastrar veículo.",
        "error"
      );
    } finally {
      setSalvando(false);
    }
  }

  function abrirConfirmacaoExclusao(veiculo: Veiculo) {
    setVeiculoParaExcluir(veiculo);
  }

  function fecharConfirmacaoExclusao() {
    if (excluindo) return;
    setVeiculoParaExcluir(null);
  }

  async function confirmarExclusao() {
    if (!veiculoParaExcluir) return;

    const id = veiculoParaExcluir.id;

    try {
      setExcluindo(true);

      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao excluir veículo.");
      }

      setVeiculos((atual) => atual.filter((veiculo) => veiculo.id !== id));
      setVeiculoParaExcluir(null);
      mostrarAlert("Veículo excluído com sucesso.", "success");
    } catch (error) {
      console.error(error);
      mostrarAlert(
        error instanceof Error ? error.message : "Erro ao excluir veículo.",
        "error"
      );
    } finally {
      setExcluindo(false);
    }
  }

  function textoStatus(status: Status) {
    if (status === "approved") return "Aprovado";
    if (status === "rejected") return "Reprovado";
    return "Aguardando aprovação";
  }

  function classeStatus(status: Status) {
    if (status === "approved") return "bg-[#e9faf4] text-[#079b6c]";
    if (status === "rejected") return "bg-red-50 text-red-600";
    return "bg-amber-50 text-amber-600";
  }

  return (
    <main className="min-h-screen px-[5px] pb-10">
      {alert.show && (
        <div className="fixed right-5 top-5 z-[9999] w-[390px] max-w-[calc(100vw-40px)]">
          <div
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.15)] ${
              alert.type === "success"
                ? "border-emerald-200"
                : alert.type === "error"
                  ? "border-red-200"
                  : "border-blue-200"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                alert.type === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : alert.type === "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
              }`}
            >
              {alert.type === "success" ? "✓" : alert.type === "error" ? "!" : "i"}
            </div>

            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${
                  alert.type === "success"
                    ? "text-emerald-700"
                    : alert.type === "error"
                      ? "text-red-700"
                      : "text-blue-700"
                }`}
              >
                {alert.type === "success"
                  ? "Sucesso"
                  : alert.type === "error"
                    ? "Erro"
                    : "Informação"}
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                {alert.message}
              </p>
            </div>

            <button
              type="button"
              onClick={fecharAlert}
              className="flex h-6 w-6 items-center justify-center rounded-md text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="min-h-[4vh] px-0">
        <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.8px] text-white">
          Veículos <span className="text-[#8ff2ea]">cadastrados</span>
        </h1>
      </header>

      <section className="pt-7">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-5 border-b border-[#dce5eb] px-6 py-[22px] max-md:flex-col max-md:items-stretch">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Meus veículos</h2>
              <p className="mt-1 text-[13px] text-[#7185af]">
                Consulte e gerencie os veículos cadastrados.
              </p>
            </div>

            {(veiculos.length === 0 ||
              veiculos.every(
                (veiculo) => veiculo.vehicle_request_status === "rejected"
              )) && (
              <button
                type="button"
                onClick={abrirModalCadastro}
                className="cursor-pointer rounded-2xl bg-[#08b6aa] px-[18px] py-3 text-[13px] font-bold text-white shadow-[0_5px_12px_rgba(0,182,170,0.18)] transition hover:-translate-y-px hover:bg-[#009f95]"
              >
                + Cadastrar veículo
              </button>
            )}
          </div>

          <div className="flex gap-3 border-b border-[#dce5eb] bg-[#fbfcfd] px-6 py-4 max-md:flex-wrap">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-[#7890ad]">
                ⌕
              </span>

              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por placa, marca, modelo, VIN..."
                className="h-[42px] w-full rounded-lg border border-[#d9e2e8] bg-white pl-[38px] pr-3 text-[13px] outline-none focus:border-[#08b6aa] focus:ring-4 focus:ring-[#08b6aa]/10"
              />
            </div>

            <select
              value={statusFiltro}
              onChange={(event) =>
                setStatusFiltro(event.target.value as "todos" | Status)
              }
              className="h-[42px] w-[190px] cursor-pointer rounded-lg border border-[#d9e2e8] bg-white px-3 text-[13px] text-[#27364c] outline-none focus:border-[#08b6aa] max-md:flex-1"
            >
              <option value="todos">Todos os status</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Aguardando aprovação</option>
              <option value="rejected">Reprovados</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Número da Placa
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Marca / Modelo
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Categoria
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Validade da Habilitação
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Combustível
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Status
                  </th>
                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-right text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-500">
                      Carregando veículos...
                    </td>
                  </tr>
                ) : (
                  veiculosFiltrados.map((veiculo) => (
                    <tr
                      key={veiculo.id}
                      className="border-t border-[#e4e9ee] transition hover:bg-[#fbfefd]"
                    >
                      <td className="px-[22px] py-[17px]">
                        <div className="flex items-center gap-3">
                          <ImagemVeiculo
                            fontes={[
                              urlImagem(veiculo.model_image, IMAGE_BASE_MODEL),
                              urlImagem(
                                veiculo.category_image ||
                                  vehicleCategories.find(
                                    (categoria) =>
                                      String(categoria.id) ===
                                      String(veiculo.category_id)
                                  )?.image,
                                IMAGE_BASE_CATEGORY
                              ),
                            ]}
                            alt={
                              veiculo.model_name ||
                              veiculo.category_name ||
                              "Veículo"
                            }
                          />

                          <div>
                            <strong className="block text-sm text-[#10213a]">
                              {veiculo.licence_plate_number || "Sem placa"}
                            </strong>
                            <span className="text-[11px] text-[#7185af]">
                              VIN: {veiculo.vin_number || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-[22px] py-[17px]">
                        <strong className="block text-sm text-[#10213a]">
                          {veiculo.brand_name || "-"}
                        </strong>
                        <span className="text-[12px] text-[#7185af]">
                          {veiculo.model_name || "-"}
                        </span>
                      </td>

                      <td className="px-[22px] py-[17px] text-[13px] text-[#24354d]">
                        {veiculo.category_name || "-"}
                      </td>

                      <td className="px-[22px] py-[17px] text-[13px] text-[#24354d]">
                        {formatarData(veiculo.licence_expire_date)}
                      </td>

                      <td className="px-[22px] py-[17px] text-[13px] capitalize text-[#24354d]">
                        {veiculo.fuel_type || "-"}
                      </td>

                      <td className="px-[22px] py-[17px]">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${classeStatus(
                            veiculo.vehicle_request_status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {textoStatus(veiculo.vehicle_request_status)}
                        </span>
                      </td>

                      <td className="px-[22px] py-[17px]">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              mostrarAlert(
                                "A edição será liberada em uma próxima etapa.",
                                "info"
                              )
                            }
                            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[7px] border border-[#dfe6eb] bg-white text-[#577093] hover:border-[#9fded8] hover:bg-[#f2fffd] hover:text-[#009f95]"
                            title="Editar"
                          >
                            ✎
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirConfirmacaoExclusao(veiculo)}
                            className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[7px] border border-[#dfe6eb] bg-white text-[#577093] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            title="Excluir"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!carregando && veiculosFiltrados.length === 0 && (
              <div className="px-5 py-14 text-center text-[#71819d]">
                <div className="mb-2 text-4xl">🚗</div>
                <strong className="block">Nenhum veículo encontrado</strong>
                <span className="text-sm">
                  {veiculos.length === 0
                    ? "Cadastre um novo veículo para começar."
                    : "Nenhum veículo corresponde aos filtros selecionados."}
                </span>
              </div>
            )}
          </div>
        </section>
      </section>

      {modalAberto && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModalCadastro();
          }}
        >
          <div className="w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between border-b border-[#e2e8ee] px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Cadastrar veículo
                </h2>
                <p className="mt-0 text-sm text-slate-500">
                  O veículo será enviado para análise da equipe.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharModalCadastro}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={cadastrarVeiculo}>
              <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Campo label="Categoria do Veículo" obrigatorio>
                    <select
                      value={form.category_id}
                      onChange={(event) =>
                        alterarCampo("category_id", event.target.value)
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Selecione a categoria</option>
                      {vehicleCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Marca do Veículo" obrigatorio>
                    <select
                      value={form.brand_id}
                      onChange={(event) => alterarMarca(event.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Selecione a marca</option>
                      {vehicleBrands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Modelo do Veículo" obrigatorio>
                    <select
                      value={form.model_id}
                      onChange={(event) =>
                        alterarCampo("model_id", event.target.value)
                      }
                      disabled={!form.brand_id || carregandoModelos}
                      className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                    >
                      <option value="">
                        {!form.brand_id
                          ? "Selecione a marca primeiro"
                          : carregandoModelos
                            ? "Carregando modelos..."
                            : vehicleModels.length === 0
                              ? "Nenhum modelo encontrado"
                              : "Selecione o modelo"}
                      </option>

                      {vehicleModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Número da Placa" obrigatorio>
                    <input
                      value={form.license_plate_number}
                      onChange={(event) =>
                        alterarCampo(
                          "license_plate_number",
                          event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                        )
                      }
                      placeholder="ABC1234"
                      maxLength={7}
                      className={inputClass}
                    />
                  </Campo>

                  <Campo label="Data de Validade da Habilitação" obrigatorio>
                    <input
                      type="date"
                      value={form.license_expire_date}
                      onChange={(event) =>
                        alterarCampo("license_expire_date", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Campo>

                  <Campo label="Combustível" obrigatorio>
                    <select
                      value={form.fuel_type}
                      onChange={(event) =>
                        alterarCampo("fuel_type", event.target.value)
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" disabled>
                        Selecione o tipo de combustível
                      </option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diesel</option>
                      <option value="etanol">Etanol</option>
                      <option value="flex">Flex</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="gas natural veicular">
                        Gás Natural Veicular (GNV)
                      </option>
                    </select>
                  </Campo>

                  <Campo label="Capacidade de carga (kg)" obrigatorio>
                    <input
                      type="number"
                      min="0"
                      value={form.parcel_weight_capacity}
                      onChange={(event) =>
                        alterarCampo(
                          "parcel_weight_capacity",
                          event.target.value
                        )
                      }
                      placeholder="150"
                      className={inputClass}
                    />
                  </Campo>

                  <Campo label="Propriedade" obrigatorio>
                    <select
                      value={form.ownership}
                      onChange={(event) =>
                        alterarCampo("ownership", event.target.value)
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" disabled>
                        Selecione a propriedade
                      </option>
                      <option value="driver">Próprio</option>
                      <option value="rented">Alugado</option>
                    </select>
                  </Campo>

                  <Campo label="Número do VIN" obrigatorio>
                    <input
                      value={form.vin_number}
                      onChange={(event) =>
                        alterarCampo(
                          "vin_number",
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="Digite o VIN"
                      maxLength={17}
                      className={inputClass}
                    />
                  </Campo>

                  <Campo label="Câmbio" obrigatorio>
                    <select
                      value={form.transmission}
                      onChange={(event) =>
                        alterarCampo("transmission", event.target.value)
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="AMT">AMT</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automático</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </Campo>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <div className="text-lg">⚠️</div>
                    <div>
                      <p className="text-sm font-bold text-amber-800">
                        Aprovação necessária
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Depois do cadastro, o veículo ficará como{" "}
                        <strong>aguardando aprovação</strong>. A equipe deverá
                        analisar os documentos antes que o veículo seja aprovado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#e2e8ee] bg-[#fbfcfd] px-6 py-4">
                <button
                  type="button"
                  onClick={fecharModalCadastro}
                  disabled={salvando}
                  className="rounded-xl border border-[#d7e0e6] bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-xl bg-[#08b6aa] px-5 py-3 text-sm font-bold text-white shadow-[0_5px_12px_rgba(0,182,170,0.18)] hover:bg-[#009f95] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Enviando..." : "Cadastrar veículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {veiculoParaExcluir && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharConfirmacaoExclusao();
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-veiculo"
            className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-start gap-4 px-6 pb-5 pt-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
                !
              </div>

              <div className="flex-1">
                <h2
                  id="titulo-excluir-veiculo"
                  className="text-lg font-extrabold text-red-700"
                >
                  Excluir veículo?
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  Você está prestes a excluir o veículo{" "}
                  <strong className="text-slate-900">
                    {veiculoParaExcluir.licence_plate_number || "sem placa"}
                  </strong>
                  {veiculoParaExcluir.brand_name ||
                  veiculoParaExcluir.model_name ? (
                    <>
                      {" "}
                      (
                      {[
                        veiculoParaExcluir.brand_name,
                        veiculoParaExcluir.model_name,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      )
                    </>
                  ) : null}
                  .
                </p>

                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">
                  Esta ação não pode ser desfeita.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e2e8ee] bg-[#fbfcfd] px-6 py-4">
              <button
                type="button"
                onClick={fecharConfirmacaoExclusao}
                disabled={excluindo}
                className="rounded-xl border border-[#d7e0e6] bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-[0_5px_12px_rgba(220,38,38,0.2)] hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Sim, excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputClass = `h-[44px] w-full rounded-lg border border-[#d9e2e8] bg-white px-3 text-[13px] text-[#27364c] outline-none transition focus:border-[#08b6aa] focus:ring-4 focus:ring-[#08b6aa]/10`;

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold text-[#425979]">
        {label}
        {obrigatorio && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
