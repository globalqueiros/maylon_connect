// components/Receipt.tsx

import Image from "next/image";

interface ReceiptProps {
  receipt: {
    order: string;
    customer: string;
    email: string;
    amount: string;
    method: string;
    transactionId: string;
    authorization?: string;
    status: string;
    date: string;
  };
}

export default function Receipt({ receipt }: ReceiptProps) {
  return (
    <div className="mx-auto w-[210mm] bg-white p-10 text-black">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b-2 border-gray-300 pb-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo-maylon.png"
            alt="Maylon Pay"
            width={70}
            height={70}
          />

          <div>
            <h1 className="text-3xl font-bold text-emerald-700">
              MAYLON PAY
            </h1>

            <p className="text-sm text-gray-500">
              Recibo Oficial de Pagamento
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">Recibo Nº</p>
          <p className="font-bold">{receipt.order}</p>

          <p className="mt-3 text-sm text-gray-500">
            Emitido em
          </p>

          <p>{receipt.date}</p>
        </div>
      </div>

      {/* Status */}
      <div className="my-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-emerald-700">
              Pagamento Confirmado
            </h2>

            <p className="mt-2 text-gray-600">
              Este documento comprova a aprovação do pagamento.
            </p>
          </div>

          <div className="rounded-full bg-emerald-600 px-5 py-2 font-semibold text-white">
            {receipt.status}
          </div>

        </div>
      </div>

      {/* Dados */}
      <div className="grid grid-cols-2 gap-8">

        <div className="space-y-4">

          <h3 className="border-b pb-2 text-lg font-semibold">
            Dados do Cliente
          </h3>

          <Item
            title="Nome"
            value={receipt.customer}
          />

          <Item
            title="Email"
            value={receipt.email}
          />

        </div>

        <div className="space-y-4">

          <h3 className="border-b pb-2 text-lg font-semibold">
            Dados da Transação
          </h3>

          <Item
            title="Pedido"
            value={receipt.order}
          />

          <Item
            title="Valor"
            value={receipt.amount}
          />

          <Item
            title="Método"
            value={receipt.method}
          />

          <Item
            title="Transação"
            value={receipt.transactionId}
          />

          {receipt.authorization && (
            <Item
              title="Autorização"
              value={receipt.authorization}
            />
          )}

        </div>

      </div>

      {/* Observação */}
      <div className="mt-10 rounded-lg bg-gray-100 p-5 text-sm text-gray-700">
        Este recibo comprova que o pagamento foi processado e
        confirmado pela plataforma <strong>Maylon Pay</strong>.
        Guarde este documento para futuras consultas.
      </div>

      {/* Rodapé */}
      <div className="mt-16 border-t pt-6 text-center text-sm text-gray-500">
        <p className="font-semibold">
          MAYLON PAY
        </p>

        <p>
          Sistema Seguro de Pagamentos
        </p>

        <p className="mt-2">
          www.maylonpay.com.br
        </p>

        <p className="mt-4">
          Documento gerado eletronicamente.
          Não necessita assinatura.
        </p>
      </div>
    </div>
  );
}

function Item({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="font-medium text-gray-500">
        {title}
      </span>

      <span className="font-semibold">
        {value}
      </span>
    </div>
  );
}