"use client";

import { useState } from "react";
import {
  X,
  Video,
  CalendarDays,
  Clock,
} from "lucide-react";

type VideoCallModalProps = {
  carId: number;
  carName: string;
  carModel: string;
};

export default function VideoCallModal({
  carId,
  carName,
  carModel,
}: VideoCallModalProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSchedule() {
    if (!date || !time) {
      alert("Selecione a data e o horário.");
      return;
    }

    try {
      setLoading(true);

      console.log({
        carId,
        carName,
        carModel,
        date,
        time,
      });

      setOpen(false);
      setDate("");
      setTime("");

      alert("Solicitação de videochamada enviada!");
    } catch (error) {
      console.error("Erro ao solicitar videochamada:", error);
      alert("Não foi possível solicitar o agendamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl cursor-pointer bg-teal-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-teal-700"
      >
        Agendar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
                  <Video
                    size={24}
                    className="text-teal-600"
                  />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Agendar videochamada
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Veja o veículo ao vivo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Veículo
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {carName}
                </p>

                <p className="text-sm text-slate-500">
                  {carModel}
                </p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <CalendarDays
                      size={17}
                      className="text-teal-600"
                    />
                    Data
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    min={new Date()
                      .toISOString()
                      .split("T")[0]}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Clock
                      size={17}
                      className="text-teal-600"
                    />
                    Horário
                  </label>

                  <input
                    type="time"
                    value={time}
                    onChange={(event) =>
                      setTime(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-teal-50 p-4">
                <p className="text-sm leading-6 text-teal-800">
                  Escolha uma data e um horário para solicitar
                  uma videochamada com o responsável pelo veículo.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Enviando..."
                    : "Solicitar agendamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}