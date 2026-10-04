"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Status =
  | "pending"
  | "approved"
  | "rejected";

type AlertType =
  | "success"
  | "error"
  | "info";

type AlertState = {
  show: boolean;
  message: string;
  type: AlertType;
};

type Veiculo = {
  id: string | number;

  brand_id: string;
  model_id: string;
  category_id: string;

  license_plate_number: string;
  license_expire_date: string;

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

  fuel_type: "petrol",

  ownership: "driver",
};

export default function VeiculosPage() {
  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [veiculos, setVeiculos] =
    useState<Veiculo[]>([]);

  const [busca, setBusca] =
    useState("");

  const [statusFiltro, setStatusFiltro] =
    useState<"todos" | Status>("todos");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [form, setForm] =
    useState<FormVeiculo>(
      formularioInicial
    );

  /*
  |--------------------------------------------------------------------------
  | ALERT
  |--------------------------------------------------------------------------
  */

  const [alert, setAlert] =
    useState<AlertState>({
      show: false,
      message: "",
      type: "info",
    });

  function mostrarAlert(
    message: string,
    type: AlertType = "info"
  ) {
    setAlert({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setAlert({
        show: false,
        message: "",
        type: "info",
      });
    }, 3500);
  }

  function fecharAlert() {
    setAlert({
      show: false,
      message: "",
      type: "info",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | BUSCAR VEÍCULOS
  |--------------------------------------------------------------------------
  */

  async function carregarVeiculos() {
    try {
      setCarregando(true);

      const response =
        await fetch("/api/vehicles", {
          method: "GET",
          cache: "no-store",
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Erro ao carregar veículos."
        );
      }

      setVeiculos(
        data.vehicles || []
      );
    } catch (error) {
      console.error(error);

      mostrarAlert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar veículos.",
        "error"
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVeiculos();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const veiculosFiltrados =
    useMemo(() => {
      return veiculos.filter(
        (veiculo) => {
          const termo =
            busca
              .toLowerCase()
              .trim();

          const texto =
            `
            ${veiculo.license_plate_number}
            ${veiculo.vin_number}
            ${veiculo.brand_id}
            ${veiculo.model_id}
            ${veiculo.category_id}
            ${veiculo.fuel_type}
            ${veiculo.transmission}
            ${veiculo.ownership}
            `
              .toLowerCase();

          const encontrouBusca =
            texto.includes(termo);

          const encontrouStatus =
            statusFiltro === "todos" ||
            veiculo.vehicle_request_status ===
              statusFiltro;

          return (
            encontrouBusca &&
            encontrouStatus
          );
        }
      );
    }, [
      veiculos,
      busca,
      statusFiltro,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ESTATÍSTICAS
  |--------------------------------------------------------------------------
  */

  const total =
    veiculos.length;

  const aprovados =
    veiculos.filter(
      (veiculo) =>
        veiculo.vehicle_request_status ===
        "approved"
    ).length;

  const pendentes =
    veiculos.filter(
      (veiculo) =>
        veiculo.vehicle_request_status ===
        "pending"
    ).length;

  const rejeitados =
    veiculos.filter(
      (veiculo) =>
        veiculo.vehicle_request_status ===
        "rejected"
    ).length;

  /*
  |--------------------------------------------------------------------------
  | ABRIR MODAL
  |--------------------------------------------------------------------------
  */

  function abrirModalCadastro() {
    setForm(
      formularioInicial
    );

    setModalAberto(true);
  }

  /*
  |--------------------------------------------------------------------------
  | FECHAR MODAL
  |--------------------------------------------------------------------------
  */

  function fecharModalCadastro() {
    if (salvando) return;

    setModalAberto(false);

    setForm(
      formularioInicial
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ALTERAR FORM
  |--------------------------------------------------------------------------
  */

  function alterarCampo(
    campo: keyof FormVeiculo,
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | CADASTRAR
  |--------------------------------------------------------------------------
  */

  async function cadastrarVeiculo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /*
    |--------------------------------------------------------------------------
    | VALIDAÇÃO
    |--------------------------------------------------------------------------
    */

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
      mostrarAlert(
        "Preencha todos os campos obrigatórios.",
        "error"
      );

      return;
    }

    try {
      setSalvando(true);

      const response =
        await fetch(
          "/api/vehicles",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              brand_id:
                form.brand_id,

              model_id:
                form.model_id,

              category_id:
                form.category_id,

              license_plate_number:
                form.license_plate_number,

              license_expire_date:
                form.license_expire_date,

              vin_number:
                form.vin_number,

              transmission:
                form.transmission,

              parcel_weight_capacity:
                Number(
                  form.parcel_weight_capacity
                ),

              fuel_type:
                form.fuel_type,

              ownership:
                form.ownership,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Não foi possível cadastrar o veículo."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FECHA MODAL
      |--------------------------------------------------------------------------
      */

      setModalAberto(false);

      setForm(
        formularioInicial
      );

      /*
      |--------------------------------------------------------------------------
      | ATUALIZA LISTA
      |--------------------------------------------------------------------------
      */

      await carregarVeiculos();

      /*
      |--------------------------------------------------------------------------
      | ALERTA
      |--------------------------------------------------------------------------
      */

      mostrarAlert(
        "Veículo cadastrado e enviado para aprovação da equipe.",
        "success"
      );
    } catch (error) {
      console.error(error);

      mostrarAlert(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar veículo.",
        "error"
      );
    } finally {
      setSalvando(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR
  |--------------------------------------------------------------------------
  */

  async function excluirVeiculo(
    id: string | number
  ) {
    const confirmar =
      window.confirm(
        "Deseja realmente excluir este veículo?"
      );

    if (!confirmar) return;

    try {
      const response =
        await fetch(
          `/api/vehicles/${id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Erro ao excluir veículo."
        );
      }

      setVeiculos(
        (veiculos) =>
          veiculos.filter(
            (veiculo) =>
              veiculo.id !== id
          )
      );

      mostrarAlert(
        "Veículo excluído com sucesso.",
        "success"
      );
    } catch (error) {
      console.error(error);

      mostrarAlert(
        error instanceof Error
          ? error.message
          : "Erro ao excluir veículo.",
        "error"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STATUS
  |--------------------------------------------------------------------------
  */

  function textoStatus(
    status: Status
  ) {
    if (status === "approved") {
      return "Aprovado";
    }

    if (status === "rejected") {
      return "Reprovado";
    }

    return "Aguardando aprovação";
  }

  function classeStatus(
    status: Status
  ) {
    if (status === "approved") {
      return "bg-[#e9faf4] text-[#079b6c]";
    }

    if (status === "rejected") {
      return "bg-red-50 text-red-600";
    }

    return "bg-amber-50 text-amber-600";
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen px-[5px] pb-10">

      {/* =====================================================
          ALERTA
      ===================================================== */}

      {alert.show && (
        <div className="fixed right-5 top-5 z-[9999] w-[390px] max-w-[calc(100vw-40px)]">

          <div
            className={`
              flex items-start gap-3
              rounded-xl border
              bg-white p-4
              shadow-[0_10px_40px_rgba(0,0,0,0.15)]
              ${
                alert.type ===
                "success"
                  ? "border-emerald-200"
                  : alert.type ===
                    "error"
                  ? "border-red-200"
                  : "border-blue-200"
              }
            `}
          >

            <div
              className={`
                flex h-9 w-9 shrink-0
                items-center justify-center
                rounded-full
                text-sm font-bold
                ${
                  alert.type ===
                  "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : alert.type ===
                      "error"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }
              `}
            >
              {alert.type ===
              "success"
                ? "✓"
                : alert.type ===
                  "error"
                ? "!"
                : "i"}
            </div>

            <div className="flex-1">

              <p
                className={`
                  text-sm font-semibold
                  ${
                    alert.type ===
                    "success"
                      ? "text-emerald-700"
                      : alert.type ===
                        "error"
                      ? "text-red-700"
                      : "text-blue-700"
                  }
                `}
              >
                {alert.type ===
                "success"
                  ? "Sucesso"
                  : alert.type ===
                    "error"
                  ? "Erro"
                  : "Informação"}
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                {alert.message}
              </p>

            </div>

            <button
              type="button"
              onClick={
                fecharAlert
              }
              className="
                flex h-6 w-6
                items-center justify-center
                rounded-md
                text-lg
                text-slate-400
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              ×
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="
          min-h-[8vh]
          border-b border-white/50
          px-0 pb-[10px] pt-[10px]
        "
      >

        <h1
          className="
            text-[30px]
            font-extrabold
            leading-tight
            tracking-[-0.8px]
            text-white
          "
        >
          Veículos{" "}
          <span className="text-[#8ff2ea]">
            cadastrados
          </span>
        </h1>

      </header>

      <section className="pt-7">

        <section
          className="
            overflow-hidden
            rounded-xl
            bg-white
            shadow-sm
          "
        >

          {/* HEADER */}

          <div
            className="
              flex items-center
              justify-between
              gap-5
              border-b border-[#dce5eb]
              px-6 py-[22px]
              max-md:flex-col
              max-md:items-stretch
            "
          >

            <div>

              <h2 className="text-lg font-extrabold text-slate-900">
                Meus veículos
              </h2>

              <p className="mt-1 text-[13px] text-[#7185af]">
                Consulte e gerencie os veículos cadastrados.
              </p>

            </div>

            <button
              type="button"
              onClick={
                abrirModalCadastro
              }
              className="
                cursor-pointer
                rounded-2xl
                bg-[#08b6aa]
                px-[18px] py-3
                text-[13px]
                font-bold text-white
                shadow-[0_5px_12px_rgba(0,182,170,0.18)]
                transition
                hover:-translate-y-px
                hover:bg-[#009f95]
              "
            >
              + Cadastrar veículo
            </button>

          </div>

          {/* FILTROS */}

          <div
            className="
              flex gap-3
              border-b border-[#dce5eb]
              bg-[#fbfcfd]
              px-6 py-4
              max-md:flex-wrap
            "
          >

            <div className="relative flex-1">

              <span
                className="
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-lg text-[#7890ad]
                "
              >
                ⌕
              </span>

              <input
                type="text"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar por placa, VIN..."
                className="
                  h-[42px] w-full
                  rounded-lg
                  border border-[#d9e2e8]
                  bg-white
                  pl-[38px] pr-3
                  text-[13px]
                  outline-none
                  focus:border-[#08b6aa]
                  focus:ring-4
                  focus:ring-[#08b6aa]/10
                "
              />

            </div>

            <select
              value={statusFiltro}
              onChange={(event) =>
                setStatusFiltro(
                  event.target.value as
                    | "todos"
                    | Status
                )
              }
              className="
                h-[42px]
                w-[190px]
                cursor-pointer
                rounded-lg
                border border-[#d9e2e8]
                bg-white px-3
                text-[13px]
                text-[#27364c]
                outline-none
                focus:border-[#08b6aa]
                max-md:flex-1
              "
            >

              <option value="todos">
                Todos os status
              </option>

              <option value="approved">
                Aprovados
              </option>

              <option value="pending">
                Aguardando aprovação
              </option>

              <option value="rejected">
                Reprovados
              </option>

            </select>

          </div>

          {/* TABELA */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px] border-collapse">

              <thead>

                <tr>

                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Placa
                  </th>

                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    VIN
                  </th>

                  <th className="bg-[#f6f9fb] px-[22px] py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[#51698e]">
                    Carga
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
                    <td
                      colSpan={6}
                      className="px-5 py-14 text-center text-sm text-slate-500"
                    >
                      Carregando veículos...
                    </td>
                  </tr>
                ) : (
                  veiculosFiltrados.map(
                    (veiculo) => (
                      <tr
                        key={
                          veiculo.id
                        }
                        className="
                          border-t
                          border-[#e4e9ee]
                          transition
                          hover:bg-[#fbfefd]
                        "
                      >

                        {/* PLACA */}

                        <td className="px-[22px] py-[17px]">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                flex h-[42px] w-[42px]
                                items-center
                                justify-center
                                rounded-[9px]
                                bg-[#e9f9f6]
                                text-xl
                              "
                            >
                              🚙
                            </div>

                            <div>

                              <strong className="block text-sm text-[#10213a]">
                                {
                                  veiculo.license_plate_number
                                }
                              </strong>

                              <small className="mt-0.5 block text-[#8091ad]">
                                {veiculo.transmission}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* VIN */}

                        <td className="px-[22px] py-[17px]">

                          <span className="text-[12px] font-semibold text-[#24354d]">
                            {
                              veiculo.vin_number
                            }
                          </span>

                        </td>

                        {/* CARGA */}

                        <td className="px-[22px] py-[17px] text-[13px] text-[#24354d]">
                          {
                            veiculo.parcel_weight_capacity
                          }{" "}
                          kg
                        </td>

                        {/* COMBUSTÍVEL */}

                        <td className="px-[22px] py-[17px] text-[13px] capitalize text-[#24354d]">
                          {
                            veiculo.fuel_type
                          }
                        </td>

                        {/* STATUS */}

                        <td className="px-[22px] py-[17px]">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-full
                              px-2.5 py-1.5
                              text-[11px]
                              font-bold
                              ${classeStatus(
                                veiculo.vehicle_request_status
                              )}
                            `}
                          >

                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                            {textoStatus(
                              veiculo.vehicle_request_status
                            )}

                          </span>

                        </td>

                        {/* AÇÕES */}

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
                              className="
                                flex h-[34px]
                                w-[34px]
                                cursor-pointer
                                items-center
                                justify-center
                                rounded-[7px]
                                border
                                border-[#dfe6eb]
                                bg-white
                                text-[#577093]
                                hover:border-[#9fded8]
                                hover:bg-[#f2fffd]
                                hover:text-[#009f95]
                              "
                              title="Editar"
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                excluirVeiculo(
                                  veiculo.id
                                )
                              }
                              className="
                                flex h-[34px]
                                w-[34px]
                                cursor-pointer
                                items-center
                                justify-center
                                rounded-[7px]
                                border
                                border-[#dfe6eb]
                                bg-white
                                text-[#577093]
                                hover:border-red-200
                                hover:bg-red-50
                                hover:text-red-500
                              "
                              title="Excluir"
                            >
                              🗑
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

            {!carregando &&
              veiculosFiltrados.length ===
                0 && (
                <div className="px-5 py-14 text-center text-[#71819d]">

                  <div className="mb-2 text-4xl">
                    🚗
                  </div>

                  <strong className="block">
                    Nenhum veículo encontrado
                  </strong>

                  <span className="text-sm">
                    Cadastre um novo veículo
                    para começar.
                  </span>

                </div>
              )}

          </div>

        </section>

      </section>

      {/* =====================================================
          MODAL CADASTRO
      ===================================================== */}

      {modalAberto && (
        <div
          className="
            fixed inset-0 z-[9998]
            flex items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModalCadastro();
            }
          }}
        >

          <div
            className="
              w-full
              max-w-[720px]
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-[0_25px_80px_rgba(0,0,0,0.25)]
            "
          >

            {/* HEADER MODAL */}

            <div
              className="
                flex items-center
                justify-between
                border-b
                border-[#e2e8ee]
                px-6 py-5
              "
            >

              <div>

                <h2 className="text-xl font-extrabold text-slate-900">
                  Cadastrar veículo
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  O veículo será enviado para análise da equipe.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  fecharModalCadastro
                }
                className="
                  flex h-9 w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-xl
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                cadastrarVeiculo
              }
            >

              <div
                className="
                  max-h-[70vh]
                  overflow-y-auto
                  px-6 py-6
                "
              >

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  {/* BRAND */}

                  <Campo
                    label="Marca ID"
                    obrigatorio
                  >
                    <input
                      value={
                        form.brand_id
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "brand_id",
                          event.target.value
                        )
                      }
                      placeholder="UUID da marca"
                      className={inputClass}
                    />
                  </Campo>

                  {/* MODEL */}

                  <Campo
                    label="Modelo ID"
                    obrigatorio
                  >
                    <input
                      value={
                        form.model_id
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "model_id",
                          event.target.value
                        )
                      }
                      placeholder="UUID do modelo"
                      className={inputClass}
                    />
                  </Campo>

                  {/* CATEGORY */}

                  <Campo
                    label="Categoria ID"
                    obrigatorio
                  >
                    <input
                      value={
                        form.category_id
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "category_id",
                          event.target.value
                        )
                      }
                      placeholder="UUID da categoria"
                      className={inputClass}
                    />
                  </Campo>

                  {/* PLACA */}

                  <Campo
                    label="Placa"
                    obrigatorio
                  >
                    <input
                      value={
                        form.license_plate_number
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "license_plate_number",
                          event.target.value
                        )
                      }
                      placeholder="ABC-1234"
                      maxLength={8}
                      className={inputClass}
                    />
                  </Campo>

                  {/* VALIDADE */}

                  <Campo
                    label="Validade da licença"
                    obrigatorio
                  >
                    <input
                      type="date"
                      value={
                        form.license_expire_date
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "license_expire_date",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </Campo>

                  {/* VIN */}

                  <Campo
                    label="VIN / Chassi"
                    obrigatorio
                  >
                    <input
                      value={
                        form.vin_number
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "vin_number",
                          event.target.value
                        )
                      }
                      placeholder="Número do chassi"
                      maxLength={50}
                      className={inputClass}
                    />
                  </Campo>

                  {/* TRANSMISSION */}

                  <Campo
                    label="Transmissão"
                    obrigatorio
                  >
                    <select
                      value={
                        form.transmission
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "transmission",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >

                      <option value="AMT">
                        AMT
                      </option>

                      <option value="manual">
                        Manual
                      </option>

                      <option value="automatic">
                        Automática
                      </option>

                      <option value="CVT">
                        CVT
                      </option>

                    </select>
                  </Campo>

                  {/* CARGA */}

                  <Campo
                    label="Capacidade de carga (kg)"
                    obrigatorio
                  >
                    <input
                      type="number"
                      min="0"
                      value={
                        form.parcel_weight_capacity
                      }
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

                  {/* COMBUSTÍVEL */}

                  <Campo
                    label="Combustível"
                    obrigatorio
                  >
                    <select
                      value={
                        form.fuel_type
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "fuel_type",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >

                      <option value="petrol">
                        Gasolina
                      </option>

                      <option value="diesel">
                        Diesel
                      </option>

                      <option value="ethanol">
                        Etanol
                      </option>

                      <option value="flex">
                        Flex
                      </option>

                      <option value="electric">
                        Elétrico
                      </option>

                      <option value="hybrid">
                        Híbrido
                      </option>

                    </select>
                  </Campo>

                  {/* OWNERSHIP */}

                  <Campo
                    label="Propriedade"
                    obrigatorio
                  >
                    <select
                      value={
                        form.ownership
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "ownership",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >

                      <option value="driver">
                        Próprio
                      </option>

                      <option value="company">
                        Empresa
                      </option>

                      <option value="rented">
                        Alugado
                      </option>

                      <option value="leased">
                        Leasing
                      </option>

                    </select>
                  </Campo>

                </div>

                {/* AVISO */}

                <div
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-4
                  "
                >

                  <div className="flex gap-3">

                    <div className="text-lg">
                      ⚠️
                    </div>

                    <div>

                      <p className="text-sm font-bold text-amber-800">
                        Aprovação necessária
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Depois do cadastro, o veículo
                        ficará como{" "}
                        <strong>
                          aguardando aprovação
                        </strong>
                        . A equipe deverá analisar
                        os documentos antes que o
                        veículo seja aprovado.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* FOOTER */}

              <div
                className="
                  flex
                  justify-end
                  gap-3
                  border-t
                  border-[#e2e8ee]
                  bg-[#fbfcfd]
                  px-6 py-4
                "
              >

                <button
                  type="button"
                  onClick={
                    fecharModalCadastro
                  }
                  disabled={salvando}
                  className="
                    rounded-xl
                    border
                    border-[#d7e0e6]
                    bg-white
                    px-5 py-3
                    text-sm
                    font-bold
                    text-slate-600
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={salvando}
                  className="
                    rounded-xl
                    bg-[#08b6aa]
                    px-5 py-3
                    text-sm
                    font-bold
                    text-white
                    shadow-[0_5px_12px_rgba(0,182,170,0.18)]
                    hover:bg-[#009f95]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {salvando
                    ? "Enviando..."
                    : "Cadastrar veículo"}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

const inputClass = `
  h-[44px]
  w-full
  rounded-lg
  border
  border-[#d9e2e8]
  bg-white
  px-3
  text-[13px]
  text-[#27364c]
  outline-none
  transition
  focus:border-[#08b6aa]
  focus:ring-4
  focus:ring-[#08b6aa]/10
`;

/*
|--------------------------------------------------------------------------
| CAMPO
|--------------------------------------------------------------------------
*/

function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-[12px] font-bold text-[#425979]">

        {label}

        {obrigatorio && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </span>

      {children}

    </label>
  );
}

/*
|--------------------------------------------------------------------------
| CARD
|--------------------------------------------------------------------------
*/

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <article
      className="
        flex
        min-h-[118px]
        items-start
        justify-between
        rounded-xl
        bg-white
        p-5
        shadow-sm
      "
    >

      <div>

        <div className="text-sm text-[#526a9d]">
          {title}
        </div>

        <div className="mt-[11px] text-[25px] font-extrabold text-slate-900">
          {value}
        </div>

        <div className="mt-2.5 text-xs text-[#7890bc]">
          {description}
        </div>

      </div>

      <div
        className={`
          flex h-10 w-10
          items-center
          justify-center
          rounded-[9px]
          text-lg
          ${iconClass}
        `}
      >
        {icon}
      </div>

    </article>
  );
}
