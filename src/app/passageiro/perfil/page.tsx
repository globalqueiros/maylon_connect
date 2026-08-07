"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Car,
  User,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  CircleAlert,
  IdCard,
  Phone,
  Mail,
  LockKeyhole,
  Camera,
} from "lucide-react";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  identification_number: string | null;
  identification_type: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  tipo: "driver" | "customer";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState("/favicon.ico");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] =
    useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sidebar",
      String(collapsed)
    );
  }, [collapsed]);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });

        if (!res.ok) {
          window.location.href = "/";
          return;
        }

        const data = await res.json();

        if (!data.id) {
          window.location.href = "/";
          return;
        }

        setUsuario(data);

        if (data.profile_image) {
          setImgSrc(data.profile_image);
        }
      } catch (err) {
        console.error(err);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [alert]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const formatPhoneBR = (phone: string) => {
    if (!phone) return "";

    let digits = phone.replace(/\D/g, "");

    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }

    if (digits.length === 11) {
      return digits.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return digits;
  };

  const handleSalvarSenha = async () => {
    setErro("");

    if (!senha || !confirmar) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve possuir no mínimo 8 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao alterar senha.");
        return;
      }

      setAlert({
        type: "success",
        message: "Senha alterada com sucesso.",
      });

      setOpen(false);
      setSenha("");
      setConfirmar("");
    } catch (error) {
      console.error(error);

      setErro("Erro interno do servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({
        type: "error",
        message: "Selecione uma imagem.",
      });

      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      setUploading(true);
      const res = await fetch(
        "/api/upload-photo",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setAlert({
          type: "error",
          message:
            "Erro ao atualizar foto.",
        });
        return;
      }
      setImgSrc(data.url);
      setShowModal(false);
      setPreviewSrc(null);
      setSelectedFile(null);
      setAlert({
        type: "success",
        message:
          "Foto atualizada com sucesso.",
      });
    } catch {
      setAlert({
        type: "error",
        message:
          "Erro inesperado.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0B6F68] via-[#35A78D] to-white">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#35A78D] border-t-transparent" />
          <p className="mt-4 text-center font-medium text-gray-600">
            Carregando informações...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen p-6">
      <div className="flex flex-1 flex-col">
          <div className="relative mb-20 overflow-visible rounded-3xl shadow-xl">
            <Image
              src="/bg-login.png"
              alt="Banner"
              width={1600}
              height={400}
              priority
              className="h-[250px] w-full rounded-3xl object-cover"
            />
            <div className="absolute inset-0 rounded-3xl bg-black/45" />
            <div className="absolute -bottom-14 left-8 z-20">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-xl">
                  <Image
                    src={imgSrc}
                    alt="Perfil"
                    width={128}
                    height={128}
                    onError={() =>
                      setImgSrc("/favicon.ico")
                    }
                    className="h-full w-full object-cover cursor-pointer"
                  />
                </div>
                <button
                  onClick={() =>
                    document
                      .getElementById("uploadFoto")
                      ?.click()
                  }
                  className="absolute bottom-2 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#18B6A2] text-white shadow-lg transition hover:bg-[#149C8B]"
                >
                  <Pencil size={18} className="cursor-pointer" />
                </button>
                <input
                  id="uploadFoto"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];
                    if (!file) return;
                    setSelectedFile(file);
                    const preview =
                      URL.createObjectURL(file);
                    setPreviewSrc(preview);
                    setShowModal(true);
                  }}
                />
              </div>
            </div>
          </div>
          {alert && (
            <div
              className={`mb-6 rounded-2xl border px-5 py-4 shadow ${alert.type === "success"
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-red-300 bg-red-50 text-red-700"
                }`}
            >
              {alert.message}
            </div>
          )}
          {usuario && (
            <div className="rounded-3xl bg-white shadow-xl">
              <div className="border-b px-8 py-6">
                <h2 className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  {usuario.tipo === "driver" ? (
                    <>
                      <Car className="text-[#149C8B]" />
                      Dados do Motorista
                    </>
                  ) : (
                    <>
                      <User className="text-[#149C8B]" />
                      Dados do Passageiro
                    </>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-5 border-b px-8 py-3">
                <div className="rounded-xl bg-teal-50 p-3">
                  <User className="text-[#149C8B]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    <span className="text-gray-500 font-medium">
                      Nome Completo:
                    </span>{" "}
                    {usuario.full_name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between border-b px-8 py-3">
                <div className="flex items-center gap-5">
                  <div className="rounded-xl bg-teal-50 p-3">
                    <Phone className="text-[#149C8B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">
                      <span className="text-gray-500 font-medium">
                        Telefone:
                      </span>{" "}
                      {formatPhoneBR(usuario.phone)}
                    </h3>
                  </div>
                </div>
                {usuario.phone_verified_at ? (
                  <span className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                    <ShieldCheck size={18} />
                    Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                    <CircleAlert size={18} />
                    Pendente
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between border-b px-8 py-3">
                <div className="flex items-center gap-5">
                  <div className="rounded-xl bg-teal-50 p-3">
                    <Mail className="text-[#149C8B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">
                      <span className="text-gray-500 font-medium">
                        E-mail:
                      </span>{" "}
                      {usuario.email}
                    </h3>
                  </div>
                </div>
                {usuario.email_verified_at ? (
                  <span className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                    <ShieldCheck size={18} />
                    Verificado
                  </span>
                ) : (
                  <span className="flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                    <CircleAlert size={18} />
                    Pendente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-5 px-8 py-3">
                <div className="rounded-xl bg-teal-50 p-3">
                  <IdCard className="text-[#149C8B]" />
                </div>
                <div className="flex items-center gap-2 text-base">
                  <span className="text-gray-500 font-medium">
                    Nº de Identificação:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {usuario.identification_number || "Não informado"}
                  </span>
                  {usuario.identification_type && (
                    <span className="font-semibold text-gray-900">
                      / {usuario.identification_type}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="my-6 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-teal-50 p-3">
                  <Lock className="text-[#149C8B]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    Alterar senha
                  </h3>
                  <p className="text-gray-500">
                    Atualize sua senha para manter sua conta protegida.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(true)}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 font-semibold text-white transition hover:bg-[#11897D]"
              >
                <LockKeyhole size={18} />
                <span className="text-sm">Alterar senha</span>
              </button>
            </div>
          </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative border-b border-gray-100 px-8 py-7">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPreviewSrc(null);
                  }}
                  className="absolute cursor-pointer right-5 top-5 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                  <Camera size={30} className="text-[#149C8B]" />
                </div>
                <h2 className="text-center text-2xl font-bold text-gray-900">
                  Alterar foto
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Escolha uma nova foto para o seu perfil.
                </p>
              </div>
              <div className="p-8 pt-5">
                {previewSrc && (
                  <div className="mb-8 flex justify-center">
                    <div className="rounded-full border-4 border-teal-100 p-1 shadow-md">
                      <Image
                        src={previewSrc}
                        alt="Pré-visualização"
                        width={180}
                        height={180}
                        className="h-44 w-44 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setPreviewSrc(null);
                    }}
                    className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={uploading}
                    onClick={handleUpload}
                    className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 font-semibold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Enviando..." : "Salvar Foto"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="relative border-b border-gray-100 px-8 py-7">
                <button
                  onClick={() => {
                    setOpen(false);
                    setSenha("");
                    setConfirmar("");
                    setErro("");
                  }}
                  className="absolute cursor-pointer right-5 top-5 rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                  <LockKeyhole
                    size={30}
                    className="text-[#149C8B]"
                  />
                </div>
                <h2 className="text-center text-2xl font-bold text-gray-900">
                  Alterar senha
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Crie uma senha segura para proteger sua conta.
                </p>
              </div>
              <div className="space-y-5 p-8 pt-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nova senha
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-12 outline-none transition focus:border-[#149C8B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showSenha ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmar ? "text" : "password"}
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-12 outline-none transition focus:border-[#149C8B]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmar(!showConfirmar)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmar ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
                {erro && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {erro}
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setSenha("");
                      setConfirmar("");
                      setErro("");
                    }}
                    className="flex-1 cursor-pointer rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleSalvarSenha}
                    className="flex-1 cursor-pointer rounded-xl bg-[#149C8B] py-3 font-semibold text-white transition hover:bg-[#11897D] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}