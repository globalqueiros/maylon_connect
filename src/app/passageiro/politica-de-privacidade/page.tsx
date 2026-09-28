const titulo =
    "text-center text-lg font-semibold sm:text-xl md:text-2xl lg:text-3xl 2xl:text-4xl";

const subtitulo =
    "mb-3 mt-6 text-base font-semibold sm:mt-8 sm:text-lg lg:text-xl 2xl:mt-10 2xl:text-2xl";

const paragrafo =
    "text-left text-sm leading-6 sm:text-justify sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

const paragrafoEsquerda =
    "text-left text-sm leading-6 sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

const lista =
    "list-disc pl-5 text-sm leading-6 sm:pl-6 sm:leading-7 md:text-base 2xl:text-lg 2xl:leading-8";

export default function Page() {
    return (
        <>
            <div className="mx-auto my-4 w-full bg-[#35aa8a] rounded-2xl p-4 text-left text-white sm:my-5 sm:p-6 md:p-8 lg:max-w-5xl lg:p-10 xl:max-w-6xl 2xl:max-w-7xl 2xl:p-14">
                <h1 className={titulo}>
                    POLÍTICA DE PRIVACIDADE — MAYLON
                </h1>

                <p className="my-3 text-left text-xs sm:text-sm 2xl:text-base">
                    Última atualização:{" "}
                    <strong>10 de setembro de 2026</strong>
                </p>

                <p className={paragrafo}>
                    A Maylon valoriza a privacidade e a proteção dos dados pessoais
                    de seus usuários. Esta Política de Privacidade explica, de forma
                    transparente, quais dados podem ser coletados, como são utilizados,
                    armazenados e protegidos, bem como os direitos dos titulares de
                    dados nos termos da legislação aplicável, especialmente a Lei Geral
                    de Proteção de Dados Pessoais —{" "}
                    <strong>LGPD (Lei nº 13.709/2018)</strong>.
                </p>

                <h2 className={subtitulo}>
                    1. Quais dados são coletados
                </h2>

                <p className={paragrafo}>
                    Durante a utilização dos serviços da Maylon, poderão ser coletados
                    dados pessoais necessários para cadastro, identificação, prestação
                    dos serviços, atendimento, segurança e demais finalidades informadas
                    ao usuário.
                </p>

                <p className={`${paragrafoEsquerda} mt-3`}>
                    Os dados coletados poderão incluir:
                </p>

                <ul className={lista}>
                    <li>Nome completo;</li>
                    <li>CPF;</li>
                    <li>Número de telefone;</li>
                    <li>Endereço de e-mail;</li>
                    <li>Dados de localização, quando necessários e autorizados;</li>
                    <li>Dados relacionados à utilização dos serviços;</li>
                    <li>Informações necessárias para atendimento e suporte;</li>
                    <li>Dados relacionados à assinatura e aos benefícios contratados.</li>
                </ul>

                <p className={`${paragrafo} mt-3`}>
                    A Maylon busca coletar apenas os dados necessários para as
                    finalidades relacionadas aos seus serviços.
                </p>

                <h2 className={subtitulo}>
                    2. Nome, CPF, telefone, e-mail e localização
                </h2>

                <p className={paragrafo}>
                    Os dados cadastrais poderão ser utilizados para identificar o
                    usuário, criar e administrar sua conta, prestar os serviços
                    contratados, realizar comunicações relacionadas à conta e oferecer
                    suporte.
                </p>

                <p className={paragrafo}>
                    O CPF poderá ser utilizado para identificação, validação cadastral,
                    prevenção de fraudes, cumprimento de obrigações legais e demais
                    finalidades legítimas relacionadas aos serviços.
                </p>

                <p className={paragrafo}>
                    O telefone e o e-mail poderão ser utilizados para comunicações sobre
                    a conta, atendimento, confirmações, notificações e informações
                    relacionadas aos serviços contratados.
                </p>

                <p className={paragrafo}>
                    Os dados de localização poderão ser utilizados quando necessários
                    para funcionalidades que dependam da localização do usuário,
                    sempre observadas as permissões concedidas e as regras aplicáveis
                    de proteção de dados.
                </p>

                <h2 className={subtitulo}>
                    3. Dados de pagamento
                </h2>

                <p className={paragrafo}>
                    Para contratação de serviços ou assinaturas, poderão ser processadas
                    informações relacionadas ao pagamento.
                </p>

                <p className={paragrafo}>
                    Os dados de pagamento poderão incluir informações necessárias para
                    identificação da transação, confirmação da cobrança, processamento
                    de pagamentos, prevenção de fraudes e gerenciamento da assinatura.
                </p>

                <p className={paragrafo}>
                    Quando o pagamento for processado por empresas especializadas,
                    os dados poderão ser compartilhados com os respectivos prestadores
                    de serviços de pagamento, exclusivamente para viabilizar a
                    transação e cumprir as finalidades relacionadas ao pagamento.
                </p>

                <p className={paragrafo}>
                    A Maylon não deverá solicitar ou armazenar informações de cartão
                    de pagamento além do necessário para as finalidades permitidas e
                    dos procedimentos adotados pelos respectivos processadores de
                    pagamento.
                </p>

                <h2 className={subtitulo}>
                    4. Como os dados são armazenados
                </h2>

                <p className={paragrafo}>
                    Os dados pessoais poderão ser armazenados em sistemas, bancos de
                    dados e servidores utilizados pela Maylon ou por prestadores de
                    serviços contratados para essa finalidade.
                </p>

                <p className={paragrafo}>
                    A Maylon adota medidas técnicas e organizacionais destinadas a
                    proteger os dados pessoais contra acesso não autorizado, perda,
                    alteração, divulgação indevida ou destruição.
                </p>

                <p className={paragrafo}>
                    Os dados serão mantidos pelo período necessário para cumprir as
                    finalidades para as quais foram coletados, atender obrigações
                    legais ou regulatórias, exercer direitos e cumprir outras hipóteses
                    previstas na legislação.
                </p>

                <p className={paragrafo}>
                    Quando não houver mais necessidade de manutenção dos dados, eles
                    poderão ser eliminados ou anonimizados, observadas as obrigações
                    legais de conservação.
                </p>

                <h2 className={subtitulo}>
                    5. Compartilhamento com parceiros
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá compartilhar dados pessoais com parceiros e
                    prestadores de serviços quando esse compartilhamento for necessário
                    para disponibilizar determinados serviços, benefícios ou
                    funcionalidades ao usuário.
                </p>

                <p className={`${paragrafoEsquerda} mt-3`}>
                    O compartilhamento poderá ocorrer, por exemplo, com:
                </p>

                <ul className={lista}>
                    <li>Processadores e intermediadores de pagamento;</li>
                    <li>Prestadores de serviços tecnológicos;</li>
                    <li>Empresas responsáveis por atendimento e suporte;</li>
                    <li>Parceiros responsáveis pela disponibilização de benefícios;</li>
                    <li>
                        Prestadores necessários à execução dos serviços contratados;
                    </li>
                    <li>
                        Empresas especializadas em segurança e prevenção de fraudes;
                    </li>
                    <li>
                        Autoridades públicas, quando houver obrigação legal ou
                        determinação válida.
                    </li>
                </ul>

                <p className={`${paragrafo} mt-3`}>
                    A Maylon busca limitar o compartilhamento aos dados necessários
                    para a finalidade específica e, quando aplicável, exige que
                    terceiros adotem medidas adequadas de proteção e segurança das
                    informações.
                </p>

                <h2 className={subtitulo}>
                    6. Direitos do titular — LGPD
                </h2>

                <p className={paragrafo}>
                    Nos termos da legislação aplicável, especialmente da LGPD, o
                    titular dos dados pessoais poderá exercer direitos relacionados
                    ao tratamento de seus dados.
                </p>

                <p className={`${paragrafoEsquerda} mt-3`}>
                    Entre esses direitos estão, conforme aplicável:
                </p>

                <ul className={lista}>
                    <li>
                        Confirmar a existência de tratamento de seus dados;
                    </li>
                    <li>
                        Solicitar acesso aos dados pessoais;
                    </li>
                    <li>
                        Solicitar a correção de dados incompletos, inexatos ou
                        desatualizados;
                    </li>
                    <li>
                        Solicitar informações sobre o compartilhamento de seus dados;
                    </li>
                    <li>
                        Solicitar a eliminação de dados pessoais, quando aplicável;
                    </li>
                    <li>
                        Solicitar a portabilidade dos dados, observadas as regras legais;
                    </li>
                    <li>
                        Solicitar informações sobre as hipóteses legais utilizadas
                        para o tratamento;
                    </li>
                    <li>
                        Revogar o consentimento quando o tratamento estiver baseado
                        nessa hipótese;
                    </li>
                    <li>
                        Opor-se a determinados tratamentos, quando permitido pela
                        legislação;
                    </li>
                    <li>
                        Solicitar a revisão de decisões automatizadas, quando aplicável.
                    </li>
                </ul>

                <p className={`${paragrafo} mt-3`}>
                    Alguns direitos poderão estar sujeitos a limitações legais ou
                    regulatórias. A Maylon poderá solicitar informações necessárias
                    para confirmar a identidade do solicitante e proteger os dados
                    contra solicitações indevidas.
                </p>

                <h2 className={subtitulo}>
                    7. Cookies
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá utilizar cookies e tecnologias semelhantes para
                    melhorar a experiência de navegação, manter funcionalidades,
                    compreender a utilização dos serviços, realizar análises e
                    aumentar a segurança dos sistemas.
                </p>

                <p className={`${paragrafoEsquerda} mt-3`}>
                    Os cookies poderão ser utilizados para diferentes finalidades,
                    incluindo:
                </p>

                <ul className={lista}>
                    <li>Funcionamento essencial do site ou sistema;</li>
                    <li>Manutenção de sessões;</li>
                    <li>Preferências do usuário;</li>
                    <li>Análise de utilização;</li>
                    <li>Segurança;</li>
                    <li>Personalização de determinadas funcionalidades.</li>
                </ul>

                <p className={`${paragrafo} mt-3`}>
                    O usuário poderá, dependendo do navegador ou dispositivo utilizado,
                    configurar as preferências relacionadas aos cookies.
                </p>

                <p className={paragrafo}>
                    A desativação de determinados cookies poderá afetar algumas
                    funcionalidades dos serviços.
                </p>

                <h2 className={subtitulo}>
                    8. Segurança da informação
                </h2>

                <p className={paragrafo}>
                    A Maylon adota medidas técnicas e organizacionais destinadas a
                    proteger os dados pessoais tratados em seus sistemas.
                </p>

                <p className={paragrafo}>
                    Essas medidas podem incluir controles de acesso, mecanismos de
                    autenticação, monitoramento, proteção de sistemas, procedimentos
                    internos de segurança e outras medidas compatíveis com os riscos
                    envolvidos no tratamento.
                </p>

                <p className={paragrafo}>
                    Apesar das medidas adotadas, nenhum sistema eletrônico pode ser
                    considerado completamente seguro. Por isso, a Maylon também
                    recomenda que os usuários mantenham seus dados de acesso protegidos
                    e não compartilhem senhas ou credenciais com terceiros.
                </p>

                <p className={paragrafo}>
                    Em caso de incidente de segurança que possa acarretar risco ou
                    dano relevante aos titulares, a Maylon adotará as providências
                    cabíveis de acordo com a legislação aplicável.
                </p>

                <h2 className={subtitulo}>
                    9. Contato do Encarregado de Dados
                </h2>

                <p className={paragrafo}>
                    O usuário poderá entrar em contato com a Maylon para esclarecer
                    dúvidas, solicitar informações ou exercer seus direitos relacionados
                    à proteção de dados pessoais.
                </p>

                <div className="my-4 break-words rounded-lg border border-white/10 p-3 text-sm leading-6 sm:p-4 sm:leading-7 md:text-base 2xl:p-6 2xl:text-lg 2xl:leading-8">
                    <p>
                        <strong>
                            Encarregado pelo Tratamento de Dados Pessoais (DPO):
                        </strong>{" "}
                        Maylon
                    </p>

                    <p>
                        <strong>Canal de contato:</strong>{" "}
                        [inserir e-mail oficial do DPO]
                    </p>

                    <p>
                        <strong>Assunto sugerido:</strong>{" "}
                        Solicitação LGPD — Proteção de Dados
                    </p>
                </div>

                <p className={paragrafo}>
                    As solicitações serão analisadas de acordo com a legislação
                    aplicável e poderão exigir informações adicionais para confirmação
                    da identidade do titular.
                </p>

                <h2 className={subtitulo}>
                    10. Atualizações desta Política
                </h2>

                <p className={paragrafo}>
                    A Maylon poderá atualizar esta Política de Privacidade
                    periodicamente para refletir alterações legais, regulatórias,
                    operacionais ou tecnológicas.
                </p>

                <p className={paragrafo}>
                    A versão mais recente estará disponível nos canais oficiais da
                    Maylon, juntamente com a respectiva data de atualização.
                </p>

                <div className="mt-8 border-t border-white/20 pt-5 sm:mt-10 sm:pt-6 2xl:mt-12 2xl:pt-8">
                    <p className="text-xs font-semibold sm:text-sm 2xl:text-base">
                        Maylon — Privacidade e Proteção de Dados
                    </p>
                </div>
            </div>
        </>
    );
}