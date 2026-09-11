export default function Page() {
    return (
        <>
            <div className="m-auto p-5 bg-[#35aa8a] text-white my-5 text-left rounded-2xl">
                <h1 className="text-2xl text-center font-semibold">
                    TERMOS DE USO — MAYLON PASS
                </h1>

                <p className="text-left text-sm my-3">
                    Última atualização:{" "}
                    <strong>10 de setembro de 2026</strong>
                </p>

                <p className="text-justify text-sm leading-7">
                    <strong>Bem-vindo ao Maylon Pass.</strong>
                </p>

                <p className="text-justify text-sm leading-7">
                    O presente Termo de Uso estabelece as condições, regras e disposições
                    aplicáveis à contratação, adesão, utilização, renovação, suspensão,
                    cancelamento e encerramento do serviço de assinatura denominado
                    <strong> Maylon Pass</strong>, disponibilizado pela <strong>Maylon</strong>,
                    bem como disciplina os direitos e obrigações dos usuários e as demais
                    condições relacionadas à utilização do serviço.
                </p>

                <p className="text-justify text-sm leading-7">
                    Ao realizar a contratação, adesão, assinatura ou utilização, total ou
                    parcial, do <strong>Maylon Pass</strong>, o usuário declara, para todos os
                    fins de direito, que leu atentamente, compreendeu e concorda, de forma
                    livre, expressa e integral, com as disposições estabelecidas neste Termo
                    de Uso, na Política de Privacidade e nos demais documentos, regulamentos e
                    condições aplicáveis aos serviços disponibilizados pela
                    <strong> Maylon</strong>.
                </p>

                <p className="text-justify text-sm leading-7">
                    A utilização da <strong>Maylon Pass</strong> estará condicionada à
                    observância integral das disposições previstas neste instrumento, sendo
                    responsabilidade do usuário manter-se informado acerca de suas condições,
                    limitações, benefícios, regras de utilização e eventuais alterações
                    regularmente comunicadas pela <strong>Maylon</strong>.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    1. O que é o Maylon Pass
                </h2>

                <p className="text-justify text-sm leading-7">
                    A <strong>Maylon Pass</strong> consiste em serviço de assinatura
                    disponibilizado pela <strong>Maylon</strong>, mediante contratação pelo
                    usuário, que poderá proporcionar acesso a benefícios, vantagens, ofertas,
                    condições comerciais diferenciadas e demais serviços disponibilizados pela
                    Maylon e/ou por parceiros comerciais participantes.
                </p>

                <p className="text-justify text-sm leading-7">
                    A Maylon Pass poderá ser disponibilizado em diferentes categorias de
                    assinatura, com preços, características, benefícios, condições de utilização
                    e limitações próprias, de acordo com o plano escolhido pelo usuário no
                    momento da contratação.
                </p>

                <p className="text-justify text-sm leading-7">
                    A contratação de determinado plano não implica, necessariamente, a
                    disponibilização de todos os benefícios existentes nos demais planos, sendo
                    aplicáveis ao assinante exclusivamente os benefícios correspondentes à
                    categoria contratada, observadas as respectivas condições, limitações,
                    períodos de validade, áreas de cobertura e regras específicas.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-3">
                    1.1. Planos de Assinatura
                </h3>

                <p className="text-justify text-sm leading-7 mb-3">
                    A Maylon Pass poderá ser contratado nas categorias abaixo, observados os
                    valores e benefícios vigentes no momento da contratação:
                </p>

                <div className="overflow-x-auto rounded-xl border border-slate-200 my-5">
                    <table className="w-full min-w-[760px] text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border-b border-slate-200 px-4 py-3 text-black text-left font-semibold">
                                    Plano
                                </th>
                                <th className="border-b border-slate-200 px-4 py-3 text-black text-left font-semibold">
                                    Valor
                                </th>
                                <th className="border-b border-slate-200 px-4 py-3 text-black text-left font-semibold">
                                    Benefícios
                                </th>
                                <th className="border-b border-slate-200 px-4 py-3 text-black text-left font-semibold">
                                    Condições
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td className="border-b border-slate-200 px-4 py-4 font-semibold">
                                    Básico
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4 whitespace-nowrap">
                                    R$ 19,90/mês
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4">
                                    Condições especiais, benefícios exclusivos, ofertas
                                    disponibilizadas pela Maylon e condições diferenciadas em
                                    serviços participantes.
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4">
                                    Sujeito às regras, condições e limitações previstas nestes
                                    Termos e nas condições específicas de cada benefício.
                                </td>
                            </tr>

                            <tr>
                                <td className="border-b border-slate-200 px-4 py-4 font-semibold">
                                    Plus
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4 whitespace-nowrap">
                                    R$ 40,00/mês
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4">
                                    Todos os benefícios aplicáveis ao Plano Básico, benefícios
                                    adicionais, ofertas selecionadas, condições especiais junto
                                    aos parceiros e benefício de ambulância.
                                </td>
                                <td className="border-b border-slate-200 px-4 py-4">
                                    O benefício de ambulância está sujeito à área de cobertura,
                                    limites, disponibilidade e demais condições específicas do
                                    serviço.
                                </td>
                            </tr>

                            <tr>
                                <td className="px-4 py-4 font-semibold">
                                    Premium
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    R$ 69,90/mês
                                </td>
                                <td className="px-4 py-4">
                                    Todos os benefícios aplicáveis ao Plano Plus, benefícios
                                    exclusivos Premium, ofertas especiais, experiências e
                                    vantagens adicionais disponibilizadas aos assinantes.
                                </td>
                                <td className="px-4 py-4">
                                    Sujeito às condições específicas de cada benefício, à
                                    disponibilidade e às regras estabelecidas pela Maylon e/ou
                                    pelos parceiros participantes.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    1.2. Plano Básico
                </h3>

                <p className="text-justify text-sm leading-7">
                    O <strong>Plano Básico</strong>, atualmente comercializado pelo valor de
                    <strong> R$ 19,90 (dezenove reais e noventa centavos) por mês</strong>,
                    constitui a categoria de entrada da Maylon Pass e poderá proporcionar ao
                    assinante acesso às condições especiais, ofertas e benefícios
                    disponibilizados pela Maylon e pelos parceiros participantes.
                </p>

                <p className="text-justify text-sm leading-7">
                    Os benefícios integrantes do Plano Básico poderão incluir condições
                    comerciais diferenciadas, benefícios exclusivos, ofertas disponibilizadas
                    pela Maylon e condições especiais em serviços participantes, sempre
                    observadas as regras específicas aplicáveis a cada benefício.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    1.3. Plano Plus
                </h3>

                <p className="text-justify text-sm leading-7">
                    O <strong>Plano Plus</strong>, atualmente comercializado pelo valor de
                    <strong> R$ 40,00 (quarenta reais) por mês</strong>, contempla os benefícios
                    aplicáveis ao Plano Básico e poderá incluir benefícios adicionais, ofertas
                    selecionadas e condições diferenciadas junto à Maylon e aos parceiros
                    participantes.
                </p>

                <p className="text-justify text-sm leading-7">
                    O Plano Plus poderá incluir, ainda, benefício de ambulância, cuja utilização
                    estará integralmente condicionada às regras específicas do serviço, incluindo,
                    quando aplicável, área de cobertura, disponibilidade, limites de utilização,
                    hipóteses de atendimento, procedimentos de acionamento e demais condições
                    estabelecidas pela Maylon e/ou pelo prestador responsável.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    1.4. Plano Premium
                </h3>

                <p className="text-justify text-sm leading-7">
                    O <strong>Plano Premium</strong>, atualmente comercializado pelo valor de
                    <strong> R$ 69,90 (sessenta e nove reais e noventa centavos) por mês</strong>,
                    constitui a categoria de assinatura com maior abrangência de benefícios
                    disponibilizados pela Maylon Pass.
                </p>

                <p className="text-justify text-sm leading-7">
                    O Plano Premium poderá contemplar todos os benefícios previstos para o Plano
                    Plus, acrescidos de benefícios exclusivos, ofertas especiais, experiências,
                    condições diferenciadas e demais vantagens que venham a ser disponibilizadas
                    especificamente aos assinantes dessa categoria.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    1.5. Disposições Gerais sobre os Planos
                </h3>

                <p className="text-justify text-sm leading-7">
                    Os valores, benefícios, condições comerciais e características dos planos
                    poderão ser alterados pela Maylon, respeitadas as condições aplicáveis às
                    contratações já realizadas e observadas as disposições legais pertinentes,
                    especialmente quanto à comunicação prévia de alterações que possam afetar a
                    contratação ou a continuidade do serviço.
                </p>

                <p className="text-justify text-sm leading-7">
                    Os benefícios descritos neste Termo possuem caráter informativo e estarão
                    sujeitos à efetiva disponibilidade, às condições específicas de utilização,
                    à área de atendimento, aos limites estabelecidos, à disponibilidade dos
                    parceiros e às demais regras divulgadas nos canais oficiais da Maylon no
                    momento da contratação ou utilização.
                </p>

                <p className="text-justify text-sm leading-7">
                    A contratação de um plano não garante a disponibilidade permanente de
                    determinado benefício específico, especialmente quando este depender de
                    terceiros, parceiros comerciais, disponibilidade operacional, localização
                    geográfica ou condições específicas previamente informadas ao assinante.
                </p>

                <p className="text-justify text-sm leading-7">
                    Em caso de divergência entre as informações constantes neste Termo e as
                    condições específicas apresentadas ao usuário no momento da contratação,
                    prevalecerão, para aquela contratação, as condições expressamente
                    apresentadas e aceitas pelo usuário, desde que não contrariem a legislação
                    aplicável.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    2. Quem pode contratar
                </h2>

                <p className="text-justify text-sm leading-7">
                    A <strong>Maylon Pass</strong> poderá ser contratado por pessoa física que
                    atenda aos requisitos legais e às condições estabelecidas pela
                    <strong> Maylon</strong> para adesão e utilização do serviço.
                </p>

                <p className="text-justify text-sm leading-7">
                    Para realizar a contratação, o usuário deverá, conforme aplicável:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>
                        Possuir capacidade civil para celebrar contratos, nos termos da
                        legislação aplicável;
                    </li>
                    <li>
                        Fornecer informações verdadeiras, completas, precisas e atualizadas
                        durante o processo de cadastro e contratação;
                    </li>
                    <li>
                        Declarar ciência e concordância com integralidade destes Termos de Uso;
                    </li>
                    <li>
                        Declarar ciência da Política de Privacidade e das demais políticas e
                        condições aplicáveis ao serviço;
                    </li>
                    <li>
                        Possuir meio de pagamento válido e autorizado, quando exigido para a
                        contratação ou manutenção da assinatura;
                    </li>
                    <li>
                        Atender aos requisitos específicos eventualmente estabelecidos para
                        utilização de determinados benefícios, serviços ou ofertas;
                    </li>
                    <li>
                        Utilizar o Maylon Pass de acordo com a legislação vigente, estes Termos
                        de Uso e as orientações divulgadas pela Maylon.
                    </li>
                </ul>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    2.1. Capacidade para contratação
                </h3>

                <p className="text-justify text-sm leading-7">
                    A contratação do Maylon Pass deverá ser realizada por pessoa que possua
                    capacidade legal para assumir as obrigações decorrentes da assinatura,
                    observadas as disposições previstas na legislação brasileira.
                </p>

                <p className="text-justify text-sm leading-7">
                    Na hipótese de contratação ou utilização por pessoa que não possua plena
                    capacidade civil, deverão ser observadas as regras legais aplicáveis,
                    inclusive quanto à representação ou assistência por responsável legal,
                    quando exigível.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    2.2. Veracidade das informações
                </h3>

                <p className="text-justify text-sm leading-7">
                    O usuário é responsável pela veracidade, exatidão, integridade e atualização
                    das informações fornecidas à Maylon, comprometendo-se a comunicar ou
                    atualizar eventuais alterações sempre que necessário.
                </p>

                <p className="text-justify text-sm leading-7">
                    A Maylon não será responsável por prejuízos decorrentes de informações
                    incorretas, incompletas, desatualizadas ou fraudulentas fornecidas pelo
                    usuário, sem prejuízo das demais medidas cabíveis nos termos da legislação
                    aplicável.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    2.3. Validação da contratação
                </h3>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá, dentro dos limites permitidos pela legislação aplicável,
                    solicitar informações adicionais ou realizar procedimentos de validação
                    necessários à confirmação da identidade, elegibilidade, contratação ou
                    utilização de determinado benefício ou serviço.
                </p>

                <p className="text-justify text-sm leading-7">
                    A ausência de informações necessárias à validação poderá impedir,
                    temporariamente ou definitivamente, a conclusão da contratação ou a
                    utilização de determinado benefício, quando a informação for indispensável
                    para sua disponibilização.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    2.4. Recusa ou impedimento da contratação
                </h3>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá impedir ou recusar a contratação quando identificar
                    descumprimento dos requisitos legais ou das condições estabelecidas nestes
                    Termos de Uso, tentativa de fraude, fornecimento de informações falsas ou
                    inconsistentes, utilização indevida da plataforma ou qualquer outra
                    circunstância que impossibilite legitimamente a contratação ou a prestação
                    do serviço.
                </p>

                <p className="text-justify text-sm leading-7">
                    Eventual impedimento ou recusa será realizado de acordo com a legislação
                    aplicável, preservados os direitos do usuário e observadas as disposições
                    relativas à proteção de dados pessoais, quando aplicáveis.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    3. Como funciona a assinatura
                </h2>

                <p className="text-justify text-sm leading-7">
                    A contratação do Maylon Pass ocorre mediante a escolha de um dos
                    planos disponíveis e a confirmação da assinatura.
                </p>

                <div className="overflow-x-auto my-5">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="text-left py-3 px-3">Plano</th>
                                <th className="text-left py-3 px-3">
                                    Valor mensal
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr className="border-b border-white/10">
                                <td className="py-3 px-3 font-semibold">
                                    Básico
                                </td>
                                <td className="py-3 px-3">
                                    R$ 19,90/mês
                                </td>
                            </tr>

                            <tr className="border-b border-white/10">
                                <td className="py-3 px-3 font-semibold">
                                    Plus
                                </td>
                                <td className="py-3 px-3">
                                    R$ 40,00/mês
                                </td>
                            </tr>

                            <tr className="border-b border-white/10">
                                <td className="py-3 px-3 font-semibold">
                                    Premium
                                </td>
                                <td className="py-3 px-3">
                                    R$ 69,90/mês
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p className="text-justify text-sm leading-7">
                    A assinatura poderá ser cobrada de forma recorrente, conforme o
                    método de pagamento escolhido pelo usuário e as condições
                    apresentadas no momento da contratação.
                </p>

                <p className="text-justify text-sm leading-7">
                    Quando houver <strong>renovação automática</strong>, a assinatura
                    será renovada ao final de cada período contratado, salvo se o
                    usuário realizar o cancelamento antes da próxima cobrança,
                    observadas as regras aplicáveis.
                </p>

                <p className="text-justify text-sm leading-7">
                    A alteração de plano poderá estar sujeita às condições apresentadas
                    no momento da solicitação.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    4. Regras de utilização
                </h2>

                <p className="text-justify text-sm leading-7">
                    O Maylon Pass é pessoal e destinado exclusivamente ao usuário que
                    realizou a contratação, salvo quando determinado benefício permitir
                    expressamente sua utilização por terceiros.
                </p>

                <p className="text-sm leading-7">O usuário deverá:</p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Utilizar o Maylon Pass de maneira legal e legítima;</li>
                    <li>Fornecer informações corretas;</li>
                    <li>Manter seus dados cadastrais atualizados;</li>
                    <li>Proteger seus dados de acesso;</li>
                    <li>Não compartilhar sua conta quando isso for proibido;</li>
                    <li>Não utilizar benefícios de forma fraudulenta;</li>
                    <li>Respeitar as regras específicas de cada benefício;</li>
                    <li>Respeitar as condições estabelecidas pelos parceiros.</li>
                </ul>

                <p className="text-sm leading-7 mt-3">
                    É proibido utilizar o Maylon Pass para:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Fraude;</li>
                    <li>Falsificação de informações;</li>
                    <li>Obtenção indevida de benefícios;</li>
                    <li>Compartilhamento não autorizado;</li>
                    <li>Revenda de benefícios;</li>
                    <li>Utilização automatizada ou abusiva dos sistemas;</li>
                    <li>Qualquer atividade contrária à legislação.</li>
                </ul>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    5. Benefícios
                </h2>

                <p className="text-justify text-sm leading-7">
                    Os benefícios disponíveis dependem do plano contratado e podem
                    incluir condições especiais, descontos, ofertas, serviços,
                    experiências e vantagens disponibilizadas pela Maylon ou por
                    parceiros.
                </p>

                <p className="text-sm leading-7">
                    Os benefícios poderão possuir:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Prazo de validade;</li>
                    <li>Quantidade limitada;</li>
                    <li>Horários específicos;</li>
                    <li>Regiões de atendimento;</li>
                    <li>Necessidade de agendamento;</li>
                    <li>Regras próprias de utilização;</li>
                    <li>Limite de utilização;</li>
                    <li>Condições específicas do parceiro.</li>
                </ul>

                <p className="text-justify text-sm leading-7 mt-3">
                    A disponibilidade de determinado benefício não significa que ele
                    estará disponível de forma ilimitada ou permanente.
                </p>

                <p className="text-justify text-sm leading-7">
                    Quando houver regras específicas para determinado benefício, essas
                    regras deverão ser observadas conjuntamente com estes Termos de Uso.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    6. Limitações
                </h2>

                <p className="text-justify text-sm leading-7">
                    O Maylon Pass não garante a disponibilidade permanente de todos os
                    benefícios.
                </p>

                <p className="text-sm leading-7">
                    A disponibilidade poderá variar de acordo com:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Região;</li>
                    <li>Horário;</li>
                    <li>Capacidade de atendimento;</li>
                    <li>Disponibilidade dos parceiros;</li>
                    <li>Estoque ou quantidade disponível;</li>
                    <li>Condições operacionais;</li>
                    <li>Regras específicas do benefício.</li>
                </ul>

                <p className="text-justify text-sm leading-7 mt-3">
                    Alguns benefícios poderão exigir pagamento adicional, agendamento
                    ou cumprimento de requisitos específicos.
                </p>

                <h3 className="text-lg font-semibold mt-6 mb-2">
                    Benefício de ambulância
                </h3>

                <p className="text-justify text-sm leading-7">
                    Quando disponível no Plano Plus ou em plano superior, o benefício
                    de ambulância estará sujeito às condições específicas de atendimento,
                    área de cobertura, disponibilidade operacional e critérios definidos
                    para sua utilização.
                </p>

                <p className="text-justify text-sm leading-7">
                    A disponibilidade desse benefício{" "}
                    <strong>
                        não deve ser interpretada como substituição de atendimento
                        médico de emergência, serviço público de emergência ou cobertura
                        de seguro
                    </strong>
                    , salvo se expressamente informado pela Maylon em condições
                    específicas do benefício.
                </p>

                <p className="text-justify text-sm leading-7">
                    Em situações de emergência, o usuário deverá procurar imediatamente
                    os serviços públicos de emergência ou o atendimento médico adequado.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    7. Responsabilidades do usuário
                </h2>

                <p className="text-justify text-sm leading-7">
                    O usuário é responsável pelas informações fornecidas à Maylon
                    durante a contratação e utilização do serviço.
                </p>

                <p className="text-sm leading-7">
                    Também é responsabilidade do usuário:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Manter seus dados atualizados;</li>
                    <li>Manter seus meios de pagamento válidos;</li>
                    <li>Utilizar corretamente sua conta;</li>
                    <li>Não compartilhar credenciais de acesso;</li>
                    <li>Conferir as condições dos benefícios antes da utilização;</li>
                    <li>Respeitar as regras dos estabelecimentos parceiros;</li>
                    <li>Não praticar fraude ou abuso;</li>
                    <li>Informar imediatamente qualquer uso indevido de sua conta.</li>
                </ul>

                <p className="text-justify text-sm leading-7 mt-3">
                    O usuário poderá ser responsabilizado por prejuízos decorrentes de
                    utilização indevida de sua conta ou de informações falsas fornecidas
                    por ele, observada a legislação aplicável.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    8. Suspensão e bloqueio
                </h2>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá suspender ou bloquear temporariamente ou
                    definitivamente o acesso ao Maylon Pass quando identificar:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Suspeita de fraude;</li>
                    <li>Uso indevido do serviço;</li>
                    <li>Violação destes Termos;</li>
                    <li>Compartilhamento não autorizado da conta;</li>
                    <li>Tentativa de obtenção fraudulenta de benefícios;</li>
                    <li>Informações falsas ou inconsistentes;</li>
                    <li>Comportamento abusivo;</li>
                    <li>Inadimplência, conforme as condições de cobrança;</li>
                    <li>Determinação legal ou regulatória.</li>
                </ul>

                <p className="text-justify text-sm leading-7 mt-3">
                    Sempre que possível, a Maylon poderá comunicar o usuário sobre a
                    suspensão ou bloqueio e, quando aplicável, disponibilizar procedimento
                    para esclarecimento ou regularização.
                </p>

                <p className="text-justify text-sm leading-7">
                    O bloqueio decorrente de fraude ou violação grave poderá ocorrer
                    imediatamente.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    9. Regras dos parceiros
                </h2>

                <p className="text-justify text-sm leading-7">
                    Alguns benefícios do Maylon Pass são disponibilizados por empresas,
                    estabelecimentos ou prestadores parceiros.
                </p>

                <p className="text-justify text-sm leading-7">
                    Nesses casos, o usuário deverá cumprir também as regras estabelecidas
                    pelo respectivo parceiro.
                </p>

                <p className="text-sm leading-7">
                    O parceiro poderá estabelecer condições relacionadas a:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Agendamento;</li>
                    <li>Horários;</li>
                    <li>Disponibilidade;</li>
                    <li>Documentação;</li>
                    <li>Limites de utilização;</li>
                    <li>Área de atendimento;</li>
                    <li>Produtos ou serviços participantes;</li>
                    <li>Regras de segurança.</li>
                </ul>

                <p className="text-justify text-sm leading-7 mt-3">
                    A Maylon não poderá garantir a disponibilidade de um benefício
                    quando ela depender exclusivamente da capacidade operacional do
                    parceiro.
                </p>

                <p className="text-justify text-sm leading-7">
                    A relação específica entre o usuário e o parceiro poderá estar
                    sujeita aos termos e condições próprios daquele estabelecimento
                    ou prestador.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    10. Alterações dos benefícios
                </h2>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá criar, alterar, substituir, suspender ou encerrar
                    determinados benefícios do Maylon Pass, especialmente quando houver
                    alteração de condições comerciais, disponibilidade de parceiros,
                    questões operacionais ou encerramento de determinada parceria.
                </p>

                <p className="text-justify text-sm leading-7">
                    Sempre que possível, alterações relevantes serão comunicadas pelos
                    canais oficiais da Maylon.
                </p>

                <p className="text-justify text-sm leading-7">
                    A alteração de um benefício específico não significa necessariamente
                    alteração do plano contratado, desde que sejam preservadas as
                    condições e direitos aplicáveis ao usuário de acordo com a legislação
                    vigente.
                </p>

                <p className="text-justify text-sm leading-7">
                    Novos benefícios também poderão ser adicionados aos planos sem
                    custo adicional ou mediante condições específicas previamente
                    informadas.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    11. Alteração de plano
                </h2>

                <p className="text-justify text-sm leading-7">
                    O usuário poderá solicitar a alteração entre os planos disponíveis,
                    conforme as opções disponibilizadas pela Maylon.
                </p>

                <p className="text-sm leading-7">
                    A alteração poderá produzir efeitos:
                </p>

                <ul className="list-disc pl-6 text-sm leading-7">
                    <li>Imediatamente; ou</li>
                    <li>No próximo ciclo de cobrança;</li>
                </ul>

                <p className="text-justify text-sm leading-7">
                    dependendo das condições apresentadas no momento da alteração.
                </p>

                <p className="text-justify text-sm leading-7">
                    Eventuais diferenças de valores, créditos ou cobranças serão
                    informadas antes da confirmação da mudança.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    12. Cancelamento
                </h2>

                <p className="text-justify text-sm leading-7">
                    O usuário poderá solicitar o cancelamento de sua assinatura pelos
                    canais oficiais disponibilizados pela Maylon.
                </p>

                <p className="text-justify text-sm leading-7">
                    Após o cancelamento, o acesso aos benefícios poderá permanecer
                    ativo até o término do período já pago, quando aplicável, salvo
                    disposição diferente apresentada no momento da contratação ou
                    exigida pela legislação.
                </p>

                <p className="text-justify text-sm leading-7">
                    O cancelamento da assinatura não elimina obrigações financeiras
                    já constituídas antes da solicitação.
                </p>

                <p className="text-justify text-sm leading-7">
                    Em caso de contratação realizada fora do estabelecimento comercial,
                    poderão ser aplicáveis os direitos de arrependimento previstos na
                    legislação brasileira.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    13. Cobrança e inadimplência
                </h2>

                <p className="text-justify text-sm leading-7">
                    A cobrança será realizada de acordo com o método de pagamento
                    selecionado pelo usuário.
                </p>

                <p className="text-justify text-sm leading-7">
                    Caso uma cobrança não seja aprovada, a Maylon poderá disponibilizar
                    novas tentativas de cobrança e/ou solicitar a atualização do meio
                    de pagamento.
                </p>

                <p className="text-justify text-sm leading-7">
                    Enquanto houver pendência de pagamento, determinados benefícios
                    poderão ficar indisponíveis, observadas as regras aplicáveis e a
                    legislação vigente.
                </p>

                <p className="text-justify text-sm leading-7">
                    A regularização do pagamento poderá restabelecer o acesso quando
                    tecnicamente possível.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    14. Conta do usuário
                </h2>

                <p className="text-justify text-sm leading-7">
                    O usuário é responsável por manter a segurança de sua conta e de
                    seus dados de acesso.
                </p>

                <p className="text-justify text-sm leading-7">
                    Caso identifique acesso não autorizado, deverá comunicar a Maylon
                    imediatamente por meio dos canais oficiais de atendimento.
                </p>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá adotar medidas de segurança para proteger a conta
                    e os dados dos usuários.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    15. Privacidade e proteção de dados
                </h2>

                <p className="text-justify text-sm leading-7">
                    O tratamento dos dados pessoais do usuário será realizado de acordo
                    com a <strong>Política de Privacidade da Maylon</strong> e com a
                    legislação aplicável de proteção de dados.
                </p>

                <p className="text-justify text-sm leading-7">
                    Os dados poderão ser utilizados para finalidades relacionadas à
                    prestação do serviço, gerenciamento da assinatura, atendimento,
                    segurança, prevenção de fraude, cobrança e demais finalidades
                    descritas na Política de Privacidade.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    16. Atendimento
                </h2>

                <p className="text-justify text-sm leading-7">
                    O usuário poderá entrar em contato com a Maylon pelos canais
                    oficiais de atendimento disponibilizados pela empresa.
                </p>

                <p className="text-justify text-sm leading-7">
                    Solicitações relacionadas à assinatura, cobrança, benefícios,
                    cancelamento ou utilização do Maylon Pass poderão ser analisadas
                    pela equipe responsável.
                </p>

                <p className="text-justify text-sm leading-7">
                    Quando necessário, poderá ser gerado um número de protocolo para
                    acompanhamento da solicitação.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    17. Alterações destes Termos de Uso
                </h2>

                <p className="text-justify text-sm leading-7">
                    A Maylon poderá atualizar estes Termos de Uso para refletir
                    alterações legais, operacionais, comerciais ou tecnológicas.
                </p>

                <p className="text-justify text-sm leading-7">
                    A versão atualizada será disponibilizada nos canais oficiais
                    da Maylon.
                </p>

                <p className="text-justify text-sm leading-7">
                    A continuidade da utilização do Maylon Pass após a entrada em
                    vigor de alterações poderá estar sujeita aos novos termos,
                    respeitados os direitos assegurados pela legislação aplicável.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    18. Disposições gerais
                </h2>

                <p className="text-justify text-sm leading-7">
                    A eventual tolerância da Maylon quanto ao descumprimento de
                    qualquer disposição destes Termos não representará renúncia ao
                    direito de exigir seu cumprimento posteriormente.
                </p>

                <p className="text-justify text-sm leading-7">
                    Caso alguma disposição destes Termos seja considerada inválida
                    ou inexigível, as demais disposições permanecerão em vigor naquilo
                    que for permitido pela legislação.
                </p>

                <p className="text-justify text-sm leading-7">
                    Estes Termos deverão ser interpretados de acordo com a legislação
                    brasileira.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3">
                    19. Aceitação dos Termos
                </h2>

                <p className="text-justify text-sm leading-7">
                    Ao contratar o Maylon Pass, o usuário declara que:
                </p>

                <ul className="list-none pl-0 text-sm leading-8">
                    <li>✓ Leu e compreendeu estes Termos de Uso;</li>
                    <li>✓ Concorda com as regras de utilização do Maylon Pass;</li>
                    <li>✓ Está ciente das condições do plano escolhido;</li>
                    <li>✓ Está ciente das condições de cobrança e renovação aplicáveis;</li>
                    <li>✓ Concorda com a Política de Privacidade;</li>
                    <li>
                        ✓ Compromete-se a utilizar os benefícios de acordo com suas
                        respectivas regras.
                    </li>
                </ul>

                <div className="mt-10 pt-6 border-t border-white/20">
                    <h2 className="text-xl font-semibold mb-5">
                        MAYLON PASS
                    </h2>

                    <div className="space-y-4 text-sm leading-7">
                        <p>
                            <strong>Básico — R$ 19,90/mês</strong>
                            <br />
                            Condições especiais • Benefícios exclusivos •
                            Cancelamento simplificado
                        </p>

                        <p>
                            <strong>Plus — R$ 40,00/mês</strong>
                            <br />
                            Todos os benefícios do Básico • Benefício de ambulância*
                            • Ofertas selecionadas
                        </p>

                        <p>
                            <strong>Premium — R$ 69,90/mês</strong>
                            <br />
                            Todos os benefícios do Plus • Benefícios exclusivos
                            Premium • Experiência completa
                        </p>
                    </div>

                    <p className="text-xs text-justify leading-6 mt-6 opacity-80">
                        * O benefício de ambulância está sujeito às condições
                        específicas de utilização, disponibilidade, área de cobertura,
                        critérios de atendimento e demais regras aplicáveis ao benefício.
                    </p>
                </div>
            </div>
        </>
    );
}