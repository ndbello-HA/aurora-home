// Configuração do Aurora Home — edite antes de empacotar.
window.AURORA_CONFIG = {
  // Clima (Open-Meteo, sem chave). Padrão: São Paulo.
  city: "São Paulo",
  lat: -23.55,
  lon: -46.63,

  // Home Assistant (opcional). Deixe em branco para esconder a linha "Casa".
  // haUrl: endereço local do HA, ex.: "http://192.168.15.10:8123"
  // haToken: token de longa duração (Perfil > Segurança > Tokens de acesso de longa duração)
  haUrl: "",
  haToken: "",

  // Cartões da linha "Casa": entity_id do Home Assistant.
  haEntities: [
    // { entity: "light.sala", label: "Luz da sala" },
    // { entity: "climate.ar_sala", label: "Ar da sala" },
    // { entity: "scene.cinema", label: "Modo cinema" }
  ],

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
    { name: "Paramount+",   match: ["paramount"],             id: "3201710015067", c1: "#1f6bff", c2: "#0a2366" },
    { name: "Spotify",      match: ["spotify"],               id: "3201606009684", c1: "#1db954", c2: "#0a3d1c" }
  ]
};
