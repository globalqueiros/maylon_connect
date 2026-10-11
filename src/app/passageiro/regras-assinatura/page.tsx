const titulo =
    "text-center text-lg font-semibold sm:text-xl md:text-2xl lg:text-3xl 2xl:text-4xl";

const subtitulo =
    "mb-3 mt-6 text-base font-semibold sm:mt-8 sm:text-lg lg:text-xl 2xl:mt-10 2xl:text-2xl";

const subsubtitulo =
    "mb-3 mt-6 text-sm font-semibold sm:text-base lg:text-lg 2xl:text-xl";

const paragrafo =
    "text-left text-sm leading-6 sm:text-justify sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

const paragrafoEsquerda =
    "text-left text-sm leading-6 sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

const lista =
    "list-disc pl-5 text-sm leading-6 sm:pl-6 sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

export default function Page() {
    return (
        <>
            <div className="mx-auto my-4 w-full rounded-2xl bg-[#35aa8a] p-4 text-left text-white sm:my-5 sm:p-6 md:p-8 lg:max-w-5xl lg:p-10 xl:max-w-6xl 2xl:max-w-7xl 2xl:p-14">
                <h1 className={titulo}>
                    TERMOS DE USO — MAYLON PASS
                </h1>

                <p className="my-3 text-left text-xs sm:text-sm 2xl:text-base">
                    Última atualização:{" "}
                    <strong>10 de setembro de 2026</strong>
                </p>

                <p className={paragrafo}>
                    Estes Termos de Uso regulam a contratação e utilização do
                    Maylon Pass, serviço de assinatura disponibilizado pela
                    Maylon, que permite aos usuários acessar benefícios,
                    condições especiais, ofertas e vantagens disponibilizadas
                    pela Maylon e por seus parceiros.
                </p>

                <p className={`${paragrafo} mt-3`}>
                    Ao contratar ou utilizar o Maylon Pass, o usuário declara
                    que leu, compreendeu e concorda com estes Termos de Uso,
                    bem como com a Política de Privacidade e demais condições
                    aplicáveis aos serviços.
                </p>

                <h2 className={subtitulo}>
                    1. O que é o Maylon Pass
                </h2>

                <p className={paragrafo}>
                    O Maylon Pass é um programa de assinatura da Maylon que
                    oferece aos usuários acesso a diferentes benefícios,
                    vantagens, condições especiais e ofertas, de acordo com o
                    plano contratado.
                </p>

                <p className={paragrafo}>
                    Os benefícios podem ser disponibilizados diretamente pela
                    Maylon ou por empresas parceiras, estando sujeitos às
                    regras, condições, disponibilidade e limitações específicas
                    de cada benefício.
                </p>

                <h2 className={subtitulo}>
                    2. Quem pode contratar
                </h2>

                <p className={paragrafo}>
                    O Maylon Pass poderá ser contratado por pessoas físicas que
                    possuam capacidade legal para contratar serviços e que
                    forneçam informações verdadeiras, completas e atualizadas
                    durante o cadastro.
                </p>

                <p className={paragrafo}>
                    A Maylon poderá estabelecer requisitos adicionais para
                    determinados benefícios ou serviços, sempre que necessário
                    para sua disponibilização.
                </p>

                <p className={paragrafo}>
                    O usuário é responsável pela veracidade das informações
                    fornecidas no momento do cadastro e durante a utilização da
                    assinatura.
                </p>

                <h2 className={subtitulo}>
                    3. Termos de Assinatura, Cobrança e Cancelamento
                </h2>

                <p className={paragrafo}>
                    O Maylon Pass é disponibilizado por meio de planos de
                    assinatura que permitem ao usuário acessar benefícios e
                    condições especiais oferecidos pela Maylon e por seus
                    parceiros, conforme o plano contratado.
                </p>

                <h3 className={subsubtitulo}>
                    3.1. Planos disponíveis
                </h3>

                <p className={paragrafo}>
                    A Maylon disponibiliza os seguintes planos de assinatura:
                </p>

                <div className="my-4 overflow-hidden rounded-xl border border-white/10 sm:my-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3">
                        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r 2xl:p-6">
                            <h4 className="text-base font-semibold sm:text-lg 2xl:text-xl">
                                Maylon Pass Básico
                            </h4>

                            <p className="mt-2 text-lg font-bold sm:text-xl 2xl:text-2xl">
                                R$ 19,90/mês
                            </p>

                            <ul className={`${lista} mt-4`}>
                                <li>
                                    Acesso aos benefícios do plano Básico;
                                </li>
                                <li>
                                    Ofertas e condições especiais
                                    disponibilizadas pela Maylon;
                                </li>
                                <li>
                                    Benefícios de parceiros participantes;
                                </li>
                                <li>
                                    Condições promocionais, quando disponíveis.
                                </li>
                            </ul>
                        </div>

                        <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r 2xl:p-6">
                            <h4 className="text-base font-semibold sm:text-lg 2xl:text-xl">
                                Maylon Pass Plus
                            </h4>

                            <p className="mt-2 text-lg font-bold sm:text-xl 2xl:text-2xl">
                                R$ 40,00/mês
                            </p>

                            <ul className={`${lista} mt-4`}>
                                <li>
                                    Todos os benefícios previstos no plano
                                    Básico;
                                </li>
                                <li>
                                    Benefícios adicionais do plano Plus;
                                </li>
                                <li>
                                    Ofertas e condições especiais exclusivas;
                                </li>
                                <li>
                                    Benefícios de parceiros participantes;
                                </li>
                                <li>
                                    Benefício de assistência ou ambulância,
                                    quando disponível e conforme as condições
                                    específicas do benefício.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 sm:p-6 2xl:p-6">
                            <h4 className="text-base font-semibold sm:text-lg 2xl:text-xl">
                                Maylon Pass Premium
                            </h4>

                            <p className="mt-2 text-lg font-bold sm:text-xl 2xl:text-2xl">
                                R$ 69,90/mês
                            </p>

                            <ul className={`${lista} mt-4`}>
                                <li>
                                    Todos os benefícios previstos nos planos
                                    Básico e Plus;
                                </li>
                                <li>
                                    Benefícios adicionais do plano Premium;
                                </li>
                                <li>
                                    Condições e ofertas especiais;
                                </li>
                                <li>
                                    Benefícios exclusivos de parceiros;
                                </li>
                                <li>
                                    Benefício de assistência ou ambulância,
                                    quando disponível e conforme as condições
                                    específicas do benefício.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <p className={paragrafo}>
                    Os benefícios de cada plano poderão possuir regras
                    específicas de utilização, limitações, disponibilidade,
                    áreas de atendimento, horários, quantidade de utilizações,
                    necessidade de agendamento ou outras condições estabelecidas
                    pela Maylon ou pelo respectivo parceiro.
                </p>

                <h3 className={subsubtitulo}>
                    3.2. Contratação da assinatura
                </h3>

                <p className={paragrafo}>
                    A assinatura será considerada contratada após a conclusão
                    do processo de adesão, confirmação dos dados necessários e
                    aprovação do pagamento pelo meio disponibilizado pela
                    Maylon.
                </p>

                <p className={paragrafo}>
                    Antes da contratação, o usuário deverá verificar o plano
                    selecionado, o valor da assinatura, a periodicidade da
                    cobrança e as condições dos benefícios disponíveis.
                </p>

                <p className={paragrafo}>
                    A contratação de um plano implica a concordância do usuário
                    com os respectivos valores, condições de utilização, regras
                    de cobrança e disposições destes Termos de Uso.
                </p>

                <h3 className={subsubtitulo}>
                    3.3. Cobrança mensal ou anual
                </h3>

                <p className={paragrafo}>
                    Os planos poderão ser disponibilizados para cobrança mensal
                    ou anual, conforme as modalidades apresentadas no momento da
                    contratação.
                </p>

                <p className={paragrafo}>
                    Na modalidade mensal, o valor correspondente ao plano
                    contratado será cobrado a cada período mensal de assinatura.
                </p>

                <p className={paragrafo}>
                    Na modalidade anual, quando disponibilizada, o usuário
                    poderá realizar o pagamento correspondente ao período
                    anual, de acordo com o valor e as condições apresentados no
                    momento da contratação.
                </p>

                <p className={paragrafo}>
                    Os valores e condições eventualmente promocionais serão
                    apresentados ao usuário antes da confirmação da contratação.
                </p>

                <h3 className={subsubtitulo}>
                    3.4. Renovação automática
                </h3>

                <p className={paragrafo}>
                    Salvo quando expressamente indicado de maneira diferente no
                    momento da contratação, a assinatura poderá ser renovada
                    automaticamente ao final de cada período contratado.
                </p>

                <p className={paragrafo}>
                    Na renovação automática, será realizada nova cobrança
                    utilizando o meio de pagamento disponibilizado pelo usuário
                    e autorizado para a assinatura, observadas as condições
                    vigentes aplicáveis à renovação.
                </p>

                <p className={paragrafo}>
                    O usuário poderá solicitar o cancelamento da renovação antes
                    da próxima cobrança, observados os procedimentos e prazos
                    informados pela Maylon.
                </p>

                <h3 className={subsubtitulo}>
                    3.5. Fidelidade
                </h3>

                <p className={paragrafo}>
                    Salvo quando houver uma condição específica expressamente
                    informada no momento da contratação, os planos do Maylon
                    Pass não possuem período mínimo de fidelidade.
                </p>

                <p className={paragrafo}>
                    Caso determinada oferta promocional possua período de
                    permanência mínima ou condição especial de fidelidade, essa
                    informação deverá ser apresentada de forma clara ao usuário
                    antes da contratação.
                </p>

                <h3 className={subsubtitulo}>
                    3.6. Multa ou taxa de cancelamento
                </h3>

                <p className={paragrafo}>
                    Na ausência de período de fidelidade expressamente
                    contratado, não será aplicada multa exclusivamente pelo
                    cancelamento da assinatura.
                </p>

                <p className={paragrafo}>
                    Eventuais condições especiais, taxas ou penalidades
                    relacionadas a ofertas com fidelidade somente poderão ser
                    aplicadas quando tiverem sido previamente informadas ao
                    usuário e forem permitidas pela legislação aplicável.
                </p>

                <h3 className={subsubtitulo}>
                    3.7. Direito de arrependimento
                </h3>

                <p className={paragrafo}>
                    Nas contratações realizadas fora do estabelecimento
                    comercial, inclusive por meio digital, o consumidor poderá
                    exercer o direito de arrependimento no prazo de até{" "}
                    <strong>7 (sete) dias</strong>, contado a partir da
                    assinatura do contrato ou do recebimento do serviço ou
                    produto, conforme aplicável, nos termos do{" "}
                    <strong>
                        artigo 49 do Código de Defesa do Consumidor — CDC
                    </strong>
                    .
                </p>

                <p className={paragrafo}>
                    Quando o direito de arrependimento for aplicável, o usuário
                    poderá solicitar o cancelamento dentro do prazo legal pelos
                    canais de atendimento disponibilizados pela Maylon.
                </p>

                <p className={paragrafo}>
                    Sendo exercido regularmente o direito de arrependimento, os
                    valores eventualmente pagos serão tratados conforme a
                    legislação aplicável, observadas as condições da transação e
                    do meio de pagamento utilizado.
                </p>

                <h3 className={subsubtitulo}>
                    3.8. Como cancelar a assinatura
                </h3>

                <p className={paragrafo}>
                    O usuário poderá solicitar o cancelamento da assinatura por
                    meio dos canais disponibilizados pela Maylon, incluindo,
                    quando disponíveis:
                </p>

                <ul className={lista}>
                    <li>
                        Aplicativo ou área logada da Maylon;
                    </li>
                    <li>
                        Portal oficial da Maylon;
                    </li>
                    <li>
                        Canal oficial de atendimento via WhatsApp;
                    </li>
                    <li>
                        Outros canais oficiais eventualmente disponibilizados
                        pela Maylon.
                    </li>
                </ul>

                <p className={`${paragrafo} mt-3`}>
                    Para solicitar o cancelamento, poderá ser necessário
                    confirmar dados da conta ou outras informações necessárias
                    para garantir a segurança da solicitação.
                </p>

                <h3 className={subsubtitulo}>
                    3.9. Prazo para efetivação do cancelamento
                </h3>

                <p className={paragrafo}>
                    Após a confirmação da solicitação, o cancelamento será
                    processado pela Maylon dentro do prazo operacional necessário
                    para concluir o procedimento.
                </p>

                <p className={paragrafo}>
                    Quando o cancelamento ocorrer antes da próxima renovação e
                    não houver período contratado já pago que determine a
                    continuidade do acesso, a assinatura não deverá ser renovada
                    na próxima cobrança.
                </p>

                <p className={paragrafo}>
                    Caso o usuário já tenha realizado o pagamento de um período
                    de assinatura, o cancelamento poderá impedir cobranças
                    futuras, sem necessariamente interromper imediatamente o
                    acesso aos benefícios já contratados para o período pago,
                    salvo quando houver previsão legal ou contratual em sentido
                    contrário.
                </p>

                <h3 className={subsubtitulo}>
                    3.10. Regras de reembolso
                </h3>

                <p className={paragrafo}>
                    O reembolso de valores pagos dependerá da situação específica
                    da contratação, do motivo do cancelamento, da modalidade de
                    pagamento e das regras previstas na legislação aplicável.
                </p>

                <p className={paragrafo}>
                    Quando o usuário exercer regularmente o direito de
                    arrependimento previsto no artigo 49 do Código de Defesa do
                    Consumidor, o eventual reembolso será realizado conforme as
                    disposições legais aplicáveis.
                </p>

                <p className={paragrafo}>
                    Nos cancelamentos realizados após o prazo legal de
                    arrependimento, os valores referentes a períodos já iniciados
                    ou já utilizados poderão não ser reembolsáveis, salvo quando
                    houver previsão contratual, promocional ou legal que
                    determine condição diferente.
                </p>

                <p className={paragrafo}>
                    Quando houver cobrança indevida, duplicidade de pagamento,
                    erro de processamento ou outra situação que justifique
                    restituição, a Maylon analisará o caso e adotará as medidas
                    cabíveis para correção.
                </p>

                <p className={paragrafo}>
                    O prazo para o crédito do reembolso poderá variar de acordo
                    com o meio de pagamento utilizado e os procedimentos da
                    instituição financeira, administradora do cartão ou
                    processador de pagamentos responsável pela transação.
                </p>

                <h3 className={subsubtitulo}>
                    3.11. Falha ou recusa no pagamento
                </h3>

                <p className={paragrafo}>
                    Caso uma cobrança não seja autorizada, seja recusada ou não
                    possa ser processada, a Maylon poderá solicitar ao usuário a
                    atualização do meio de pagamento ou a regularização da
                    pendência.
                </p>

                <p className={paragrafo}>
                    Enquanto houver uma pendência de pagamento, o acesso à
                    assinatura e aos benefícios poderá ser limitado, suspenso ou
                    interrompido, observadas as condições aplicáveis e a
                    legislação vigente.
                </p>

                <h3 className={subsubtitulo}>
                    3.12. Alteração ou troca de plano
                </h3>

                <p className={paragrafo}>
                    Quando essa funcionalidade estiver disponível, o usuário
                    poderá solicitar a alteração do plano contratado para outra
                    modalidade do Maylon Pass, observadas as condições comerciais
                    apresentadas no momento da alteração.
                </p>

                <p className={paragrafo}>
                    Eventuais diferenças de preço, créditos, ajustes de cobrança
                    ou mudanças na data de renovação serão informados ao usuário
                    antes da confirmação da alteração, quando aplicável.
                </p>

                <h3 className={subsubtitulo}>
                    3.13. Benefícios após o cancelamento
                </h3>

                <p className={paragrafo}>
                    Após o cancelamento, o usuário poderá continuar utilizando
                    os benefícios correspondentes ao período já pago, quando
                    essa condição estiver prevista para a modalidade contratada.
                </p>

                <p className={paragrafo}>
                    Encerrado o período de assinatura, o acesso aos benefícios
                    exclusivos do Maylon Pass poderá ser desativado, salvo
                    quando houver disposição específica em contrário.
                </p>

                <p className={paragrafo}>
                    O cancelamento da assinatura não elimina automaticamente
                    obrigações financeiras já constituídas antes da data efetiva
                    do cancelamento, ressalvadas as hipóteses de cancelamento
                    com direito a reembolso ou outras situações previstas pela
                    legislação.
                </p>

                <h2 className={subtitulo}>
                    4. Regras de utilização
                </h2>

                <p className={paragrafo}>
                    O Maylon Pass é destinado exclusivamente ao uso pessoal do
                    titular da assinatura, salvo quando determinado benefício
                    permitir expressamente a utilização por terceiros.
                </p>

                <p className={paragrafo}>
                    O usuário deverá utilizar os benefícios de acordo com as
                    condições apresentadas no aplicativo, portal, canais
                    oficiais da Maylon ou pelos respectivos parceiros.
                </p>

                <p className={paragrafo}>
                    É proibida a utilização fraudulenta, abusiva ou irregular
                    dos benefícios disponibilizados pelo Maylon Pass.
                </p>

                <h2 className={subtitulo}>
                    5. Benefícios
                </h2>

                <p className={paragrafo}>
                    Os benefícios disponíveis dependem do plano contratado e
                    poderão incluir descontos, ofertas, condições especiais,
                    serviços, vantagens e outros benefícios disponibilizados
                    pela Maylon ou por parceiros.
                </p>

                <p className={paragrafo}>
                    A disponibilidade de determinado benefício poderá depender
                    da região, horário, disponibilidade do parceiro, estoque,
                    agendamento, elegibilidade ou outras condições específicas.
                </p>

                <p className={paragrafo}>
                    A Maylon não garante que todos os benefícios estarão
                    disponíveis de forma permanente ou em todas as localidades.
                </p>

                <h2 className={subtitulo}>
                    6. Limitações dos benefícios
                </h2>

                <p className={paragrafo}>
                    Cada benefício poderá possuir limitações próprias, incluindo
                    quantidade de utilização, período de validade, região de
                    atendimento, necessidade de agendamento, disponibilidade,
                    elegibilidade e condições estabelecidas pelo parceiro.
                </p>

                <p className={paragrafo}>
                    Benefícios de assistência, atendimento médico, ambulância ou
                    serviços semelhantes, quando disponíveis, estarão sujeitos
                    às condições específicas da empresa responsável pela
                    prestação do serviço.
                </p>

                <p className={paragrafo}>
                    A contratação do Maylon Pass não garante atendimento
                    imediato, disponibilidade ilimitada ou cobertura em qualquer
                    situação.
                </p>

                <h2 className={subtitulo}>
                    7. Responsabilidades do usuário
                </h2>

                <p className={paragrafo}>
                    O usuário deverá fornecer informações verdadeiras, manter
                    seus dados atualizados e utilizar sua conta de maneira
                    segura.
                </p>

                <p className={paragrafo}>
                    O usuário é responsável pela guarda de suas credenciais de
                    acesso e deverá comunicar à Maylon qualquer utilização não
                    autorizada de sua conta.
                </p>

                <p className={paragrafo}>
                    O usuário também deverá respeitar as regras de utilização
                    estabelecidas pela Maylon e pelos parceiros responsáveis
                    pelos benefícios.
                </p>

                <h2 className={subtitulo}>
                    8. Suspensão e bloqueio
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá suspender ou bloquear temporariamente ou
                    definitivamente o acesso ao Maylon Pass quando identificar
                    utilização fraudulenta, tentativa de fraude, informações
                    falsas, violação destes Termos ou utilização indevida dos
                    benefícios.
                </p>

                <p className={paragrafo}>
                    A suspensão também poderá ocorrer em situações relacionadas
                    a pagamentos não realizados ou problemas de segurança,
                    observadas as condições aplicáveis.
                </p>

                <h2 className={subtitulo}>
                    9. Regras dos parceiros
                </h2>

                <p className={paragrafo}>
                    Alguns benefícios são disponibilizados por empresas
                    parceiras da Maylon.
                </p>

                <p className={paragrafo}>
                    Nesses casos, o usuário deverá observar também as regras,
                    condições de atendimento, horários, limitações e políticas
                    do respectivo parceiro.
                </p>

                <p className={paragrafo}>
                    O parceiro poderá estabelecer condições específicas para a
                    utilização do benefício, desde que compatíveis com as
                    informações apresentadas ao usuário.
                </p>

                <h2 className={subtitulo}>
                    10. Alterações dos benefícios
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá incluir, alterar, substituir ou retirar
                    benefícios do Maylon Pass em razão de mudanças comerciais,
                    operacionais, tecnológicas ou relacionadas aos contratos
                    mantidos com parceiros.
                </p>

                <p className={paragrafo}>
                    Sempre que necessário, alterações relevantes serão
                    comunicadas pelos canais oficiais da Maylon.
                </p>

                <p className={paragrafo}>
                    A alteração de determinado benefício não implica,
                    necessariamente, alteração do valor da assinatura.
                </p>

                <h2 className={subtitulo}>
                    11. Conta do usuário
                </h2>

                <p className={paragrafo}>
                    Para utilizar o Maylon Pass, poderá ser necessário possuir
                    uma conta Maylon ativa.
                </p>

                <p className={paragrafo}>
                    O usuário deverá manter seus dados cadastrais atualizados e
                    utilizar informações próprias e verdadeiras.
                </p>

                <p className={paragrafo}>
                    A conta não deverá ser compartilhada com terceiros quando
                    isso puder comprometer a segurança ou as regras da
                    assinatura.
                </p>

                <h2 className={subtitulo}>
                    12. Privacidade e proteção de dados
                </h2>

                <p className={paragrafo}>
                    O tratamento dos dados pessoais dos usuários será realizado
                    de acordo com a legislação aplicável e com a Política de
                    Privacidade da Maylon.
                </p>

                <p className={paragrafo}>
                    Poderão ser tratados dados necessários para cadastro,
                    identificação, cobrança, atendimento, segurança, utilização
                    dos serviços e disponibilização dos benefícios.
                </p>

                <p className={paragrafo}>
                    Para mais informações sobre coleta, utilização,
                    armazenamento, compartilhamento e direitos dos titulares,
                    o usuário deverá consultar a Política de Privacidade da
                    Maylon.
                </p>

                <h2 className={subtitulo}>
                    13. Atendimento e suporte
                </h2>

                <p className={paragrafo}>
                    A Maylon disponibilizará canais oficiais de atendimento para
                    dúvidas, solicitações, reclamações, cancelamentos e demais
                    assuntos relacionados ao Maylon Pass.
                </p>

                <p className={paragrafo}>
                    O usuário deverá utilizar exclusivamente os canais oficiais
                    divulgados pela Maylon para tratar de informações da sua
                    conta ou assinatura.
                </p>

                <h2 className={subtitulo}>
                    14. Pagamentos em atraso
                </h2>

                <p className={paragrafo}>
                    Em caso de atraso, falha ou recusa no pagamento, a Maylon
                    poderá limitar ou suspender o acesso ao Maylon Pass até que
                    a situação seja regularizada.
                </p>

                <p className={paragrafo}>
                    A regularização poderá depender da confirmação do pagamento
                    pelo respectivo processador financeiro.
                </p>

                <h2 className={subtitulo}>
                    15. Cancelamento pela Maylon
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá cancelar ou suspender uma assinatura quando
                    houver violação destes Termos de Uso, utilização fraudulenta,
                    inadimplência, tentativa de fraude ou outras situações
                    previstas contratualmente ou pela legislação aplicável.
                </p>

                <p className={paragrafo}>
                    Quando aplicável, o usuário será informado sobre o motivo da
                    suspensão ou cancelamento, observadas as limitações legais e
                    de segurança.
                </p>

                <h2 className={subtitulo}>
                    16. Alterações destes Termos
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá atualizar estes Termos de Uso para refletir
                    alterações legais, regulatórias, comerciais, operacionais ou
                    tecnológicas.
                </p>

                <p className={paragrafo}>
                    A versão mais recente estará disponível nos canais oficiais
                    da Maylon, acompanhada da respectiva data de atualização.
                </p>

                <p className={paragrafo}>
                    Quando necessário, alterações relevantes poderão ser
                    comunicadas aos usuários pelos canais disponíveis.
                </p>

                <h2 className={subtitulo}>
                    17. Legislação aplicável
                </h2>

                <p className={paragrafo}>
                    Estes Termos de Uso serão interpretados de acordo com as
                    leis da República Federativa do Brasil, especialmente a
                    legislação de proteção e defesa do consumidor e demais
                    normas aplicáveis aos serviços.
                </p>

                <h2 className={subtitulo}>
                    18. Disposições gerais
                </h2>

                <p className={paragrafo}>
                    Caso qualquer disposição destes Termos seja considerada
                    inválida ou inexigível, as demais disposições permanecerão
                    válidas e em pleno vigor, na medida permitida pela
                    legislação aplicável.
                </p>

                <p className={paragrafo}>
                    A eventual tolerância da Maylon quanto ao descumprimento de
                    qualquer disposição não constituirá renúncia ao direito de
                    exigir seu cumprimento posteriormente.
                </p>

                <h2 className={subtitulo}>
                    19. Aceitação dos Termos
                </h2>

                <p className={paragrafo}>
                    Ao contratar, acessar ou utilizar o Maylon Pass, o usuário
                    declara que teve acesso a estes Termos de Uso, compreendeu
                    suas disposições e concorda com as condições estabelecidas.
                </p>

                <p className={paragrafo}>
                    Caso o usuário não concorde com estes Termos, deverá
                    interromper a contratação ou utilização do Maylon Pass e,
                    quando aplicável, solicitar o cancelamento da assinatura
                    pelos canais oficiais disponibilizados pela Maylon.
                </p>

                <div className="mt-8 border-t border-white/20 pt-5 sm:mt-10 sm:pt-6 2xl:mt-12 2xl:pt-8">
                    <p className="text-xs font-semibold sm:text-sm 2xl:text-base">
                        Maylon — Maylon Pass
                    </p>

                    <p className={`${paragrafoEsquerda} mt-1`}>
                        Termos de Uso, Assinatura, Cobrança e Cancelamento
                    </p>
                </div>
            </div>
        </>
    );
}