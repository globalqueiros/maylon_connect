"use client";

import { useEffect, useState } from "react";

interface Ride {
  id: number;
  origem: string;
  destino: string;
  valor: number | null;
  data: string;
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState("30");

  const fetchRides = async (days: string) => {
    const res = await fetch(`/api/rides?days=${days}`, {
      credentials: "include",
    });

    const data = await res.json();
    setRides(data);
  };

  useEffect(() => {
    fetchRides(filter);
  }, [filter]);

  const handlePrint = (ride: Ride) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Corrida</title>
          <style>
            body { font-family: Arial; padding: 20px; }
          </style>
        </head>
        <body>
          <h2>Recibo da Corrida</h2>
          <p><strong>ID:</strong> ${ride.id}</p>
          <p><strong>Origem:</strong> ${ride.origem}</p>
          <p><strong>Destino:</strong> ${ride.destino}</p>
          <p><strong>Valor:</strong> R$ ${ride.valor ?? 0}</p>
          <p><strong>Data:</strong> ${new Date(ride.data).toLocaleString()}</p>
          <br/>
          <button onclick="window.print()">Imprimir</button>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minhas Corridas</h1>
      <table className="min-w-full border rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">Origem</th>
            <th className="px-4 py-2 text-left">Destino</th>
            <th className="px-4 py-2 text-left">Valor</th>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>

        <tbody>
          {rides.map((ride) => (
            <tr key={ride.id} className="border-t">
              <td className="px-4 py-2">{ride.id}</td>
              <td className="px-4 py-2">{ride.origem}</td>
              <td className="px-4 py-2">{ride.destino}</td>
              <td className="px-4 py-2">R$ {ride.valor ?? 0}</td>
              <td className="px-4 py-2">
                {new Date(ride.data).toLocaleString()}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handlePrint(ride)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                >
                  Imprimir
                </button>
              </td>
            </tr>
          ))}

          {rides.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-sm text-white bg-red-400 p-4">
                Nenhuma corrida foi encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}