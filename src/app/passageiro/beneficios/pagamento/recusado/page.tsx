import Link from "next/link";
import {
  XCircle,
  CreditCard,
  CalendarDays,
  BadgeAlert,
} from "lucide-react";

export default function PaymentDeclined() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="border-b px-8 py-8 text-center">
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Pagamento não aprovado
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Não foi possível concluir seu pagamento.
          </p>
        </div>
        <div className="space-y-3 text-sm border-b p-6">
          <Info
            icon={<BadgeAlert className="h-5 w-5" />}
            label="Pedido"
            value="#ML202608060001"
          />
          <Info
            icon={<CreditCard className="h-5 w-5" />}
            label="Valor"
            value="R$ 59,99"
          />
          <Info
            icon={<CreditCard className="h-5 w-5" />}
            label="Método de Pagamento"
            value="Cartão / PIX"
          />
          <Info
            icon={<CalendarDays className="h-5 w-5" />}
            label="Data e Hora"
            value="06/08/2026 17:10"
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status de Pagamento</span>
            <span className="rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
              Recusado
            </span>
          </div>
        </div>
        <div className="border-b p-6">
          <h2 className="font-semibold text-gray-900">
            Motivo
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Cartão recusado pela instituição financeira
          </p>
          <div className="mt-2.5 rounded-lg bg-red-500 p-3 text-sm font-mono text-gray-200">
            Código: card_declined
          </div>
        </div>
        <div className="border-b p-6">
          <h2 className="font-semibold">
            Sugestões
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-gray-600">
            <li>• Verifique os dados do cartão</li>
            <li>• Confira o saldo ou limite disponível</li>
            <li>• Tente outro cartão</li>
            <li>• Utilize PIX</li>
          </ul>
        </div>
        <div className="space-y-3 p-6">
          <button className="w-full cursor-pointer rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700">
            Tentar novamente
          </button>
          <button className="w-full cursor-pointer rounded-xl border py-3 font-semibold transition hover:bg-gray-50">
            Alterar forma de pagamento
          </button>
          <button className="w-full cursor-pointer rounded-xl border py-3 font-semibold transition hover:bg-gray-50">
            Falar com o suporte
          </button>
          <Link
            href="/passageiro/beneficios"
            className="block w-full cursor-pointer rounded-xl bg-gray-100 py-3 text-center font-semibold transition hover:bg-gray-200"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

type InfoProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function Info({ icon, label, value }: InfoProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}