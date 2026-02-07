--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: cap_manager; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA cap_manager;


--
-- Name: area_kanban_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.area_kanban_type AS ENUM (
    'gestao_trafego',
    'faturamento',
    'dashboards',
    'gtm',
    'sites_lp',
    'projetos_concluidos'
);


--
-- Name: grupo_revisao_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.grupo_revisao_type AS ENUM (
    'A',
    'B',
    'C'
);


--
-- Name: plataforma_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.plataforma_type AS ENUM (
    'meta',
    'google',
    'tiktok',
    'linkedin',
    'twitter',
    'pinterest',
    'spotify',
    'programatica',
    'outro'
);


--
-- Name: prioridade_tarefa_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.prioridade_tarefa_type AS ENUM (
    'baixa',
    'media',
    'alta',
    'urgente'
);


--
-- Name: role_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.role_type AS ENUM (
    'admin',
    'trader',
    'gestor',
    'cliente'
);


--
-- Name: status_estrategia_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.status_estrategia_type AS ENUM (
    'planejada',
    'ativa',
    'pausada',
    'finalizada',
    'cancelada'
);


--
-- Name: status_projeto_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.status_projeto_type AS ENUM (
    'rascunho',
    'ativo',
    'pausado',
    'finalizado',
    'cancelado'
);


--
-- Name: status_tarefa_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.status_tarefa_type AS ENUM (
    'backlog',
    'todo',
    'doing',
    'review',
    'done'
);


--
-- Name: tipo_alerta_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.tipo_alerta_type AS ENUM (
    'cobranca',
    'campanha',
    'tarefa',
    'sistema'
);


--
-- Name: tipo_cobranca_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.tipo_cobranca_type AS ENUM (
    'td',
    'fee'
);


--
-- Name: tipo_followup_type; Type: TYPE; Schema: cap_manager; Owner: -
--

CREATE TYPE cap_manager.tipo_followup_type AS ENUM (
    'nota',
    'alerta',
    'atualizacao',
    'reuniao'
);


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: cap_manager; Owner: -
--

CREATE FUNCTION cap_manager.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agencias; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.agencias (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    cnpj character varying(20),
    telefone character varying(50),
    email character varying(255),
    contato character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: agencias_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.agencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agencias_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.agencias_id_seq OWNED BY cap_manager.agencias.id;


--
-- Name: alertas; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.alertas (
    id integer NOT NULL,
    tipo cap_manager.tipo_alerta_type NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    destinatario_id integer NOT NULL,
    lido boolean DEFAULT false,
    enviado_whatsapp boolean DEFAULT false,
    data_envio_whatsapp timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: alertas_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.alertas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alertas_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.alertas_id_seq OWNED BY cap_manager.alertas.id;


--
-- Name: cards_kanban; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.cards_kanban (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    area cap_manager.area_kanban_type NOT NULL,
    status character varying(100) DEFAULT 'backlog'::character varying,
    prioridade cap_manager.prioridade_tarefa_type DEFAULT 'media'::cap_manager.prioridade_tarefa_type,
    cliente_id integer,
    projeto_id integer,
    trader_id integer,
    responsavel_relatorio_id integer,
    responsavel_revisao_id integer,
    revisao_relatorio_ok boolean DEFAULT false,
    link_relatorio character varying(500),
    faturamento_card_id integer,
    data_vencimento date,
    ordem integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    observador_id integer,
    data_inicio date
);


--
-- Name: cards_kanban_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.cards_kanban_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cards_kanban_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.cards_kanban_id_seq OWNED BY cap_manager.cards_kanban.id;


--
-- Name: clientes; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.clientes (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    agencia_id integer,
    contato character varying(255),
    cnpj character varying(20),
    email character varying(255),
    whatsapp character varying(50),
    tipo_cobranca cap_manager.tipo_cobranca_type DEFAULT 'td'::cap_manager.tipo_cobranca_type,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.clientes_id_seq OWNED BY cap_manager.clientes.id;


--
-- Name: estrategias; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.estrategias (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    plataforma cap_manager.plataforma_type NOT NULL,
    nome_conta character varying(255),
    id_conta character varying(255),
    campaign_id character varying(255),
    estrategia character varying(500),
    kpi character varying(100),
    status cap_manager.status_estrategia_type DEFAULT 'planejada'::cap_manager.status_estrategia_type,
    data_inicio date,
    valor_bruto numeric(12,2) DEFAULT 0,
    porcentagem_agencia numeric(5,2) DEFAULT 0,
    porcentagem_plataforma numeric(5,2) DEFAULT 0,
    valor_liquido numeric(12,2),
    valor_plataforma numeric(12,2),
    coeficiente numeric(8,6),
    valor_por_dia_plataforma numeric(12,2),
    valor_restante numeric(12,2),
    restante_por_dia numeric(12,2),
    entrega_contratada numeric(12,2),
    percentual_entrega numeric(8,4),
    estimativa_resultado numeric(12,2),
    estimativa_sucesso numeric(8,4),
    meta_custo_resultado numeric(12,2),
    custo_resultado numeric(12,2),
    gasto_ate_momento_bruto numeric(12,2),
    valor_restante_bruto numeric(12,2),
    pode_abaixar_margem boolean,
    pode_aumentar_margem boolean,
    gasto_ate_momento numeric(12,2),
    entregue_ate_momento numeric(12,2),
    data_atualizacao timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: estrategias_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.estrategias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estrategias_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.estrategias_id_seq OWNED BY cap_manager.estrategias.id;


--
-- Name: follow_ups; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.follow_ups (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    trader_id integer NOT NULL,
    conteudo text NOT NULL,
    tipo cap_manager.tipo_followup_type DEFAULT 'nota'::cap_manager.tipo_followup_type,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: follow_ups_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.follow_ups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: follow_ups_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.follow_ups_id_seq OWNED BY cap_manager.follow_ups.id;


--
-- Name: pis; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.pis (
    id integer NOT NULL,
    identificador character varying(255) NOT NULL,
    valor_bruto numeric(12,2) NOT NULL,
    agencia_id integer,
    cliente_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: pis_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.pis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pis_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.pis_id_seq OWNED BY cap_manager.pis.id;


--
-- Name: projetos; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.projetos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    nome character varying(255) NOT NULL,
    pi_id integer,
    tipo_cobranca cap_manager.tipo_cobranca_type DEFAULT 'td'::cap_manager.tipo_cobranca_type,
    agencia_id integer,
    trader_id integer,
    colaborador_id integer,
    status cap_manager.status_projeto_type DEFAULT 'rascunho'::cap_manager.status_projeto_type,
    data_inicio date,
    data_fim date,
    link_proposta character varying(500),
    url_destino text,
    grupo_revisao cap_manager.grupo_revisao_type,
    revisao_final_ok boolean DEFAULT false,
    revisao_final_data timestamp without time zone,
    revisao_final_usuario_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: projetos_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.projetos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projetos_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.projetos_id_seq OWNED BY cap_manager.projetos.id;


--
-- Name: revisoes_diarias; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.revisoes_diarias (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    data_agendada date NOT NULL,
    revisado boolean DEFAULT false,
    data_revisao timestamp without time zone,
    revisado_por_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: revisoes_diarias_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.revisoes_diarias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revisoes_diarias_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.revisoes_diarias_id_seq OWNED BY cap_manager.revisoes_diarias.id;


--
-- Name: tarefas; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.tarefas (
    id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    status cap_manager.status_tarefa_type DEFAULT 'backlog'::cap_manager.status_tarefa_type,
    prioridade cap_manager.prioridade_tarefa_type DEFAULT 'media'::cap_manager.prioridade_tarefa_type,
    projeto_id integer,
    cliente_id integer,
    responsavel_id integer,
    data_vencimento date,
    ordem integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: tarefas_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.tarefas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tarefas_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.tarefas_id_seq OWNED BY cap_manager.tarefas.id;


--
-- Name: usuarios; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.usuarios (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    avatar_url character varying(500),
    role cap_manager.role_type DEFAULT 'trader'::cap_manager.role_type,
    whatsapp character varying(50),
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.usuarios_id_seq OWNED BY cap_manager.usuarios.id;


--
-- Name: utm_configs; Type: TABLE; Schema: cap_manager; Owner: -
--

CREATE TABLE cap_manager.utm_configs (
    id integer NOT NULL,
    projeto_id integer,
    utm_source character varying(255) NOT NULL,
    utm_medium character varying(255) NOT NULL,
    utm_campaign character varying(255) NOT NULL,
    utm_term character varying(255),
    utm_content character varying(255),
    url_destino character varying(500) NOT NULL,
    url_gerada text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: utm_configs_id_seq; Type: SEQUENCE; Schema: cap_manager; Owner: -
--

CREATE SEQUENCE cap_manager.utm_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utm_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: cap_manager; Owner: -
--

ALTER SEQUENCE cap_manager.utm_configs_id_seq OWNED BY cap_manager.utm_configs.id;


--
-- Name: agencias id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.agencias ALTER COLUMN id SET DEFAULT nextval('cap_manager.agencias_id_seq'::regclass);


--
-- Name: alertas id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.alertas ALTER COLUMN id SET DEFAULT nextval('cap_manager.alertas_id_seq'::regclass);


--
-- Name: cards_kanban id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.cards_kanban ALTER COLUMN id SET DEFAULT nextval('cap_manager.cards_kanban_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.clientes ALTER COLUMN id SET DEFAULT nextval('cap_manager.clientes_id_seq'::regclass);


--
-- Name: estrategias id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.estrategias ALTER COLUMN id SET DEFAULT nextval('cap_manager.estrategias_id_seq'::regclass);


--
-- Name: follow_ups id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.follow_ups ALTER COLUMN id SET DEFAULT nextval('cap_manager.follow_ups_id_seq'::regclass);


--
-- Name: pis id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.pis ALTER COLUMN id SET DEFAULT nextval('cap_manager.pis_id_seq'::regclass);


--
-- Name: projetos id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos ALTER COLUMN id SET DEFAULT nextval('cap_manager.projetos_id_seq'::regclass);


--
-- Name: revisoes_diarias id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.revisoes_diarias ALTER COLUMN id SET DEFAULT nextval('cap_manager.revisoes_diarias_id_seq'::regclass);


--
-- Name: tarefas id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.tarefas ALTER COLUMN id SET DEFAULT nextval('cap_manager.tarefas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.usuarios ALTER COLUMN id SET DEFAULT nextval('cap_manager.usuarios_id_seq'::regclass);


--
-- Name: utm_configs id; Type: DEFAULT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.utm_configs ALTER COLUMN id SET DEFAULT nextval('cap_manager.utm_configs_id_seq'::regclass);


--
-- Data for Name: agencias; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.agencias (id, nome, cnpj, telefone, email, contato, created_at, updated_at) FROM stdin;
3	Agência Teste	00000000000000	71999999999	contato@agencia.com	Nome do Contato da Agência	2025-12-17 14:06:49.636	2025-12-17 14:06:49.636
4	PAR COMUNICACAO ESTRATEGICA LTDA	08513748000108	7135653500	midia4@agparceira.com.br	Tharryra	2025-12-23 17:46:22.982	2025-12-23 17:46:22.982
\.


--
-- Data for Name: alertas; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.alertas (id, tipo, titulo, mensagem, destinatario_id, lido, enviado_whatsapp, data_envio_whatsapp, created_at) FROM stdin;
\.


--
-- Data for Name: cards_kanban; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.cards_kanban (id, titulo, descricao, area, status, prioridade, cliente_id, projeto_id, trader_id, responsavel_relatorio_id, responsavel_revisao_id, revisao_relatorio_ok, link_relatorio, faturamento_card_id, data_vencimento, ordem, created_at, updated_at, observador_id, data_inicio) FROM stdin;
1	teste 01	\N	gestao_trafego	backlog	alta	\N	2	1	1	\N	f	\N	\N	2025-12-25	1	2025-12-19 12:52:54.7	2025-12-19 12:53:19.751	\N	\N
2	POR DO SOM	AS, 18+ - Salvador	gestao_trafego	em_execucao	media	\N	3	3	5	3	f	\N	\N	2025-12-31	2	2025-12-23 18:12:04.453	2025-12-23 19:59:10.759	\N	\N
3	dash governo	\N	dashboards	backlog	media	1	2	1	\N	\N	f	\N	\N	2025-12-27	1	2025-12-26 15:04:57.074	2025-12-26 15:04:57.074	\N	\N
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.clientes (id, nome, agencia_id, contato, cnpj, email, whatsapp, tipo_cobranca, ativo, created_at, updated_at) FROM stdin;
1	Cliente Tets	\N	Cliente Tets	00000000000000	teste@gmail.com	71999999999	td	t	2025-12-16 19:59:55.506	2025-12-16 19:59:55.506
2	Cliente Teste 2	\N	Contato	00000000000000	contatocliente@teste.com	71999999999	fee	t	2025-12-17 14:07:54.23	2025-12-17 14:07:54.23
3	SUFOTUR	4	\N	49948074000143	\N	\N	td	t	2025-12-23 17:47:15.924	2025-12-23 17:47:15.924
\.


--
-- Data for Name: estrategias; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.estrategias (id, projeto_id, plataforma, nome_conta, id_conta, campaign_id, estrategia, kpi, status, data_inicio, valor_bruto, porcentagem_agencia, porcentagem_plataforma, valor_liquido, valor_plataforma, coeficiente, valor_por_dia_plataforma, valor_restante, restante_por_dia, entrega_contratada, percentual_entrega, estimativa_resultado, estimativa_sucesso, meta_custo_resultado, custo_resultado, gasto_ate_momento_bruto, valor_restante_bruto, pode_abaixar_margem, pode_aumentar_margem, gasto_ate_momento, entregue_ate_momento, data_atualizacao, created_at, updated_at) FROM stdin;
1	1	google	CONTA GOOGLE	123456789	123123	Conversão	CPL	planejada	\N	30000.00	10.00	20.00	\N	\N	\N	\N	\N	\N	10000.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	3000.00	500.00	2025-12-18 00:00:00	2025-12-16 20:01:22.13	2025-12-19 13:11:06.545
2	1	tiktok	TESTE	134252	52646256	Conversão	CPA	planejada	\N	10000.00	20.00	50.00	\N	\N	\N	\N	\N	\N	1000.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-19 13:01:49.025	2025-12-19 13:01:49.025
3	3	google	TD - 01 - Sufotur	736-040-6945	111	Alcance	CPM	planejada	\N	10000.00	20.00	20.00	\N	\N	\N	\N	\N	\N	909091.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	100.00	34000.00	2025-12-23 00:00:00	2025-12-23 18:00:39.863	2025-12-23 18:18:24.42
4	2	tiktok	Tiktok	1232314341	1235134354	Conversão	CPL	planejada	2025-12-19	20000.00	10.00	20.00	\N	\N	\N	\N	\N	\N	10000.00	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-23 19:47:52.161	2025-12-23 20:19:11.897
\.


--
-- Data for Name: follow_ups; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.follow_ups (id, projeto_id, trader_id, conteudo, tipo, created_at) FROM stdin;
\.


--
-- Data for Name: pis; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.pis (id, identificador, valor_bruto, agencia_id, cliente_id, created_at, updated_at) FROM stdin;
1	PI-1234	50000.00	\N	\N	2025-12-16 20:00:15.228	2025-12-16 20:00:15.228
2	PI - 5083	10000.00	4	3	2025-12-23 17:47:52.862	2025-12-23 17:47:52.862
\.


--
-- Data for Name: projetos; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.projetos (id, cliente_id, nome, pi_id, tipo_cobranca, agencia_id, trader_id, colaborador_id, status, data_inicio, data_fim, link_proposta, url_destino, grupo_revisao, revisao_final_ok, revisao_final_data, revisao_final_usuario_id, created_at, updated_at) FROM stdin;
1	1	PROJETO TESTE	1	td	\N	1	\N	finalizado	2025-12-16	2025-12-22	\N	\N	B	f	\N	\N	2025-12-16 20:00:46.056	2025-12-23 19:28:31.248
2	1	projeto x	1	td	4	3	\N	ativo	2025-12-17	2026-01-15	\N	\N	A	f	\N	\N	2025-12-17 11:40:12.293	2025-12-23 19:57:02.182
3	3	POR DO SOM 2026	2	td	4	3	5	rascunho	2025-12-23	2025-12-31	https://drive.google.com/file/d/1kt9aUkJzxG8CP_8ceqWtfnt2NP-WQ56r/view?usp=sharing	https://www.instagram.com/oficialpordosom?igsh=d3RsMjh5am9iMXpz	A	f	\N	\N	2025-12-23 17:54:37.505	2025-12-23 19:28:43.991
\.


--
-- Data for Name: revisoes_diarias; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.revisoes_diarias (id, projeto_id, data_agendada, revisado, data_revisao, revisado_por_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tarefas; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.tarefas (id, titulo, descricao, status, prioridade, projeto_id, cliente_id, responsavel_id, data_vencimento, ordem, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.usuarios (id, email, senha, nome, avatar_url, role, whatsapp, ativo, created_at, updated_at) FROM stdin;
1	admin@capmanager.com	$2b$10$xjATT7jxaPGB9YRuVp69hOhKsbqc92Xha0Nk0N9dNcjFY1avXgY9O	Administrador	\N	admin	\N	t	2025-12-16 19:49:21.478	2025-12-16 19:49:21.478
2	dados@capdigital.company		CAP Digital	\N	admin	\N	t	2025-12-19 13:50:32.318	2025-12-19 13:51:46.486
3	guilherme@capdigital.company		Guilherme Camargo	\N	admin	\N	t	2025-12-19 14:02:13.156	2025-12-19 14:04:10.53
4	pedro@capdigital.company		Pedro Napoli	\N	admin	\N	t	2025-12-19 14:02:19.786	2025-12-19 14:04:18.22
5	thiago@capdigital.company		Thiago Freitas	https://lh3.googleusercontent.com/a/ACg8ocKhdm89zdJY9B4dDWbFezez5wAnE5XUDXWKdJKgptm1yTWiMw=s96-c	trader	\N	t	2025-12-20 02:36:08.927	2025-12-20 02:36:08.927
6	atendimento@capdigital.company		Atendimento CAP	https://lh3.googleusercontent.com/a/ACg8ocIZLkXaPh-64wDg-bVBMbRmOcMZOMtE4F65ASRo3y0bSK4jaw=s96-c	trader	\N	t	2025-12-21 11:30:49.002	2025-12-21 11:30:49.002
7	pedrofreitas@capdigital.company		Pedro Freitas	https://lh3.googleusercontent.com/a/ACg8ocLHGADck19-B9iT27uPIYEZYNLOFLAprmd-pFhLVAnUpV8lZA=s96-c	trader	\N	t	2025-12-22 00:45:37.872	2025-12-22 00:45:37.872
\.


--
-- Data for Name: utm_configs; Type: TABLE DATA; Schema: cap_manager; Owner: -
--

COPY cap_manager.utm_configs (id, projeto_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, url_destino, url_gerada, created_at) FROM stdin;
\.


--
-- Name: agencias_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.agencias_id_seq', 4, true);


--
-- Name: alertas_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.alertas_id_seq', 1, true);


--
-- Name: cards_kanban_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.cards_kanban_id_seq', 3, true);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.clientes_id_seq', 3, true);


--
-- Name: estrategias_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.estrategias_id_seq', 4, true);


--
-- Name: follow_ups_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.follow_ups_id_seq', 1, true);


--
-- Name: pis_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.pis_id_seq', 2, true);


--
-- Name: projetos_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.projetos_id_seq', 3, true);


--
-- Name: revisoes_diarias_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.revisoes_diarias_id_seq', 1, true);


--
-- Name: tarefas_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.tarefas_id_seq', 1, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.usuarios_id_seq', 7, true);


--
-- Name: utm_configs_id_seq; Type: SEQUENCE SET; Schema: cap_manager; Owner: -
--

SELECT pg_catalog.setval('cap_manager.utm_configs_id_seq', 1, true);


--
-- Name: agencias agencias_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.agencias
    ADD CONSTRAINT agencias_pkey PRIMARY KEY (id);


--
-- Name: alertas alertas_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.alertas
    ADD CONSTRAINT alertas_pkey PRIMARY KEY (id);


--
-- Name: cards_kanban cards_kanban_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.cards_kanban
    ADD CONSTRAINT cards_kanban_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: estrategias estrategias_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.estrategias
    ADD CONSTRAINT estrategias_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: pis pis_identificador_key; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.pis
    ADD CONSTRAINT pis_identificador_key UNIQUE (identificador);


--
-- Name: pis pis_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.pis
    ADD CONSTRAINT pis_pkey PRIMARY KEY (id);


--
-- Name: projetos projetos_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_pkey PRIMARY KEY (id);


--
-- Name: revisoes_diarias revisoes_diarias_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.revisoes_diarias
    ADD CONSTRAINT revisoes_diarias_pkey PRIMARY KEY (id);


--
-- Name: revisoes_diarias revisoes_diarias_projeto_id_data_agendada_key; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.revisoes_diarias
    ADD CONSTRAINT revisoes_diarias_projeto_id_data_agendada_key UNIQUE (projeto_id, data_agendada);


--
-- Name: tarefas tarefas_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.tarefas
    ADD CONSTRAINT tarefas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: utm_configs utm_configs_pkey; Type: CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.utm_configs
    ADD CONSTRAINT utm_configs_pkey PRIMARY KEY (id);


--
-- Name: idx_clientes_agencia; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_clientes_agencia ON cap_manager.clientes USING btree (agencia_id);


--
-- Name: idx_clientes_ativo; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_clientes_ativo ON cap_manager.clientes USING btree (ativo);


--
-- Name: idx_projetos_cliente; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_projetos_cliente ON cap_manager.projetos USING btree (cliente_id);


--
-- Name: idx_projetos_grupo_revisao; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_projetos_grupo_revisao ON cap_manager.projetos USING btree (grupo_revisao);


--
-- Name: idx_projetos_status; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_projetos_status ON cap_manager.projetos USING btree (status);


--
-- Name: idx_projetos_status_cliente; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_projetos_status_cliente ON cap_manager.projetos USING btree (status, cliente_id);


--
-- Name: idx_projetos_trader; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_projetos_trader ON cap_manager.projetos USING btree (trader_id);


--
-- Name: idx_revisoes_data; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_revisoes_data ON cap_manager.revisoes_diarias USING btree (data_agendada);


--
-- Name: idx_revisoes_revisado; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_revisoes_revisado ON cap_manager.revisoes_diarias USING btree (revisado);


--
-- Name: idx_tarefas_responsavel; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_tarefas_responsavel ON cap_manager.tarefas USING btree (responsavel_id);


--
-- Name: idx_tarefas_status; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_tarefas_status ON cap_manager.tarefas USING btree (status);


--
-- Name: idx_tarefas_status_ordem; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_tarefas_status_ordem ON cap_manager.tarefas USING btree (status, ordem);


--
-- Name: idx_usuarios_ativo; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_usuarios_ativo ON cap_manager.usuarios USING btree (ativo);


--
-- Name: idx_usuarios_role; Type: INDEX; Schema: cap_manager; Owner: -
--

CREATE INDEX idx_usuarios_role ON cap_manager.usuarios USING btree (role);


--
-- Name: agencias update_agencias_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_agencias_updated_at BEFORE UPDATE ON cap_manager.agencias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: cards_kanban update_cards_kanban_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_cards_kanban_updated_at BEFORE UPDATE ON cap_manager.cards_kanban FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: clientes update_clientes_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON cap_manager.clientes FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: estrategias update_estrategias_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_estrategias_updated_at BEFORE UPDATE ON cap_manager.estrategias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: pis update_pis_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_pis_updated_at BEFORE UPDATE ON cap_manager.pis FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: projetos update_projetos_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON cap_manager.projetos FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: revisoes_diarias update_revisoes_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_revisoes_updated_at BEFORE UPDATE ON cap_manager.revisoes_diarias FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: tarefas update_tarefas_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON cap_manager.tarefas FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: usuarios update_usuarios_updated_at; Type: TRIGGER; Schema: cap_manager; Owner: -
--

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON cap_manager.usuarios FOR EACH ROW EXECUTE FUNCTION cap_manager.update_updated_at_column();


--
-- Name: alertas alertas_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.alertas
    ADD CONSTRAINT alertas_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES cap_manager.usuarios(id) ON DELETE CASCADE;


--
-- Name: cards_kanban cards_kanban_observador_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.cards_kanban
    ADD CONSTRAINT cards_kanban_observador_id_fkey FOREIGN KEY (observador_id) REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;


--
-- Name: clientes clientes_agencia_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.clientes
    ADD CONSTRAINT clientes_agencia_id_fkey FOREIGN KEY (agencia_id) REFERENCES cap_manager.agencias(id) ON DELETE SET NULL;


--
-- Name: estrategias estrategias_projeto_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.estrategias
    ADD CONSTRAINT estrategias_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES cap_manager.projetos(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_projeto_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.follow_ups
    ADD CONSTRAINT follow_ups_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES cap_manager.projetos(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_trader_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.follow_ups
    ADD CONSTRAINT follow_ups_trader_id_fkey FOREIGN KEY (trader_id) REFERENCES cap_manager.usuarios(id) ON DELETE CASCADE;


--
-- Name: pis pis_agencia_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.pis
    ADD CONSTRAINT pis_agencia_id_fkey FOREIGN KEY (agencia_id) REFERENCES cap_manager.agencias(id) ON DELETE SET NULL;


--
-- Name: pis pis_cliente_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.pis
    ADD CONSTRAINT pis_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cap_manager.clientes(id) ON DELETE SET NULL;


--
-- Name: projetos projetos_agencia_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_agencia_id_fkey FOREIGN KEY (agencia_id) REFERENCES cap_manager.agencias(id) ON DELETE SET NULL;


--
-- Name: projetos projetos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cap_manager.clientes(id) ON DELETE CASCADE;


--
-- Name: projetos projetos_colaborador_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;


--
-- Name: projetos projetos_pi_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_pi_id_fkey FOREIGN KEY (pi_id) REFERENCES cap_manager.pis(id) ON DELETE SET NULL;


--
-- Name: projetos projetos_trader_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.projetos
    ADD CONSTRAINT projetos_trader_id_fkey FOREIGN KEY (trader_id) REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;


--
-- Name: revisoes_diarias revisoes_diarias_projeto_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.revisoes_diarias
    ADD CONSTRAINT revisoes_diarias_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES cap_manager.projetos(id) ON DELETE CASCADE;


--
-- Name: revisoes_diarias revisoes_diarias_revisado_por_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.revisoes_diarias
    ADD CONSTRAINT revisoes_diarias_revisado_por_id_fkey FOREIGN KEY (revisado_por_id) REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;


--
-- Name: tarefas tarefas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.tarefas
    ADD CONSTRAINT tarefas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES cap_manager.clientes(id) ON DELETE SET NULL;


--
-- Name: tarefas tarefas_projeto_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.tarefas
    ADD CONSTRAINT tarefas_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES cap_manager.projetos(id) ON DELETE SET NULL;


--
-- Name: tarefas tarefas_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.tarefas
    ADD CONSTRAINT tarefas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES cap_manager.usuarios(id) ON DELETE SET NULL;


--
-- Name: utm_configs utm_configs_projeto_id_fkey; Type: FK CONSTRAINT; Schema: cap_manager; Owner: -
--

ALTER TABLE ONLY cap_manager.utm_configs
    ADD CONSTRAINT utm_configs_projeto_id_fkey FOREIGN KEY (projeto_id) REFERENCES cap_manager.projetos(id) ON DELETE CASCADE;


--
-- Name: agencias Permitir tudo para agencias; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para agencias" ON cap_manager.agencias USING (true);


--
-- Name: alertas Permitir tudo para alertas; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para alertas" ON cap_manager.alertas USING (true);


--
-- Name: cards_kanban Permitir tudo para cards_kanban; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para cards_kanban" ON cap_manager.cards_kanban USING (true);


--
-- Name: clientes Permitir tudo para clientes; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para clientes" ON cap_manager.clientes USING (true);


--
-- Name: estrategias Permitir tudo para estrategias; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para estrategias" ON cap_manager.estrategias USING (true);


--
-- Name: follow_ups Permitir tudo para follow_ups; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para follow_ups" ON cap_manager.follow_ups USING (true);


--
-- Name: pis Permitir tudo para pis; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para pis" ON cap_manager.pis USING (true);


--
-- Name: projetos Permitir tudo para projetos; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para projetos" ON cap_manager.projetos USING (true);


--
-- Name: revisoes_diarias Permitir tudo para revisoes_diarias; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para revisoes_diarias" ON cap_manager.revisoes_diarias USING (true);


--
-- Name: tarefas Permitir tudo para tarefas; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para tarefas" ON cap_manager.tarefas USING (true);


--
-- Name: usuarios Permitir tudo para usuarios; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para usuarios" ON cap_manager.usuarios USING (true);


--
-- Name: utm_configs Permitir tudo para utm_configs; Type: POLICY; Schema: cap_manager; Owner: -
--

CREATE POLICY "Permitir tudo para utm_configs" ON cap_manager.utm_configs USING (true);


--
-- PostgreSQL database dump complete
--

