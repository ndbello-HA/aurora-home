// Configuração do Aurora Home — edite antes de empacotar.
window.AURORA_CONFIG = {
  // Clima (Open-Meteo, sem chave). Padrão: São Paulo.
  city: "São Paulo",
  lat: -23.55,
  lon: -46.63,

  // Home Assistant. Login automático pelo usuário "TV Sala" via trusted_networks
  // (liberado só para o IP da TV no configuration.yaml do HA). Nenhum token aqui:
  // este repositório é público.
  haUrl: "http://192.168.15.91",
  haAuth: "trusted",
  haUser: "TV Sala",
  haToken: "",

  // TV no Home Assistant (SmartThings) e entradas da tela "Entradas".
  haTvEntity: "media_player.samsung_tv",
  // Botão "Fonte" do controle no Home Assistant: o cartão Entradas abre o menu nativo da Samsung.
  haSourceButton: "button.samsung_tv_source",
  sources: [
    { label: "TV", source: "tv" },
    { label: "HDMI 1", source: "hdmi_1" },
    { label: "HDMI 2", source: "hdmi_2" },
    { label: "HDMI 3", source: "hdmi_3" },
    { label: "HDMI 4", source: "hdmi_4" }
  ],

  // Cartões da linha "Casa".
  haEntities: [
    { entity: "light.sala_de_tv_sala_de_jantar_switch_2", label: "Luz da sala de jantar" },
    { entity: "light.sala_de_tv_sala_de_jantar_switch_1", label: "Luz da sala de TV" },
    { entity: "climate.ar_condicionado_sala", label: "Ar da sala" },
    { entity: "button.nelsondebellojr_gmail_com_preparar_o_cinema", label: "Preparar cinema" },
    { entity: "switch.tomada_abajur", label: "Abajur" }
  ],

  // Apps usados pelos botões do menu lateral (não aparecem na linha de apps).
  menuApps: [
    { name: "Spotify", match: ["spotify"], id: "3201606009684" },
    { name: "Gaming Hub", match: ["gaming hub", "game hub", "jogos", "gaming"], id: "" },
    { name: "Claro TV+", match: ["claro tv", "claro"], id: "" }
  ],

  // Jogos que devem aparecer na tela Jogos mesmo que a TV não os marque como jogo
  // (parte do nome, em minúsculas). Ex.: ["asphalt", "sonic"]
  games: [],

  // Apps da linha "Seus aplicativos". "match" procura pelo nome do app instalado;
  // "id" é o ID Tizen usado se a busca por nome falhar.
  apps: [
    { name: "IBO Player",   match: ["ibo player", "ibo"],     id: "",              c1: "#1e88e5", c2: "#0b2a55" },
    { name: "Claro TV+",    match: ["claro tv", "claro"],     id: "",              c1: "#da291c", c2: "#5e0a05" },
    { name: "Netflix",      match: ["netflix"],               id: "3201907018807", c1: "#e50914", c2: "#5c0408" },
    { name: "Prime Video",  match: ["prime video"],           id: "3201910019365", c1: "#1aa1e6", c2: "#0b3a5e" },
    { name: "Disney+",      match: ["disney"],                id: "3201901017640", c1: "#1b3fa8", c2: "#0a1640" },
    { name: "YouTube",      match: ["youtube"],               id: "111299001912",  c1: "#ff2a2a", c2: "#6e0a0a" },
    { name: "HBO Max",      match: ["hbo", "max"],            id: "3202301029760", c1: "#5b2bd6", c2: "#1b0b52" },
    { name: "Globoplay",    match: ["globoplay"],             id: "",              c1: "#ff5a1f", c2: "#7a1d04" },
    { name: "Paramount+",   match: ["paramount"],             id: "3201710015067", c1: "#1f6bff", c2: "#0a2366" }
  ]
};
