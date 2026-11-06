/* 21 mavzu va 8 blok — kitob bilan bir xil sarlavhalar va ranglar. */
window.BLOCKS = {
  1: { name: "Nazariy asoslar", color: "#3E63DD", soft: "#E8EDFB" },
  2: { name: "Polygonal modellaştiriş", color: "#0C9488", soft: "#E1F5F2" },
  3: { name: "Egri çiziqlar nazariyasi", color: "#8E4EC6", soft: "#F2EAFA" },
  4: { name: "NURBS, sirtlar va differensial geometriya", color: "#6E56CF", soft: "#EEEBFB" },
  5: { name: "Geometrik obyektlar va avatarlar", color: "#E8590C", soft: "#FDEDE3" },
  6: { name: "Teksturalaş va materiallar", color: "#D6336C", soft: "#FBE7EE" },
  7: { name: "Yoritiş va renderlaş", color: "#B98900", soft: "#FBF3D9" },
  8: { name: "Optimallaştiriş, VR/AR va eksport", color: "#2F9E44", soft: "#E6F4E9" }
};
window.TOPICS = [
  { n: 1, b: 1, title: "Uç ölçovli modellaştiriş texnologiyalariga kiriş", short: "3D modellaştirişga kiriş", lab: "Koordinatalar va transformatsiyalar", amaliy: [1, 3] },
  { n: 2, b: 1, title: "3D modellaştiriş texnologiyalarining rivojlaniş bosqiçlari", short: "Rivojlaniş bosqiçlari", lab: "3D grafika vaqt çizigi", amaliy: [] },
  { n: 3, b: 1, title: "Uç ölçovli modellaştiriş usullarining tasnifi", short: "Usullar tasnifi", lab: "Modellaştiriş usullari", amaliy: [2] },
  { n: 4, b: 1, title: "Fotogrammetriya asosida 3D model yaratiş texnologiyalari", short: "Fotogrammetriya", lab: "Fotogrammetriya simulyatori", amaliy: [6] },
  { n: 5, b: 2, title: "Polygonal modellaştiriş asoslari", short: "Polygonal modellaştiriş", lab: "Vertex, Edge, Face", amaliy: [4] },
  { n: 6, b: 2, title: "Polygonal obyektlar topologiyasi", short: "Topologiya", lab: "Subdivision laboratoriyasi", amaliy: [5] },
  { n: 7, b: 3, title: "Bezier egri çiziqlarining matematik asoslari", short: "Bezier egri çiziqlari", lab: "Bezier va de Casteljau", amaliy: [7] },
  { n: 8, b: 3, title: "Spline egri çiziqlari va ularning modellaştirişdagi örni", short: "Spline egri çiziqlari", lab: "Spline turlari", amaliy: [8] },
  { n: 9, b: 3, title: "B-Spline egri çiziqlarini quriş algoritmlari", short: "B-Spline algoritmlari", lab: "B-Spline va tugunlar vektori", amaliy: [9] },
  { n: 10, b: 4, title: "NURBS egri çiziqlari va sirtlari", short: "NURBS", lab: "NURBS vaznlari", amaliy: [10] },
  { n: 11, b: 4, title: "Spline va NURBS sirtlarini modellaştiriş", short: "Sirtlarni modellaştiriş", lab: "Sirtlar laboratoriyasi", amaliy: [9, 10] },
  { n: 12, b: 4, title: "Differensial geometriya asoslari", short: "Differensial geometriya", lab: "Egrilik laboratoriyasi", amaliy: [10] },
  { n: 13, b: 5, title: "Uç ölçovli geometrik obyektlarni quriş texnologiyalari", short: "Geometrik obyektlarni quriş", lab: "Geometrik obyektlar konstruktori", amaliy: [2, 3, 8] },
  { n: 14, b: 5, title: "Avatar modellaştiriş texnologiyalari", short: "Avatar modellaştiriş", lab: "Avatar proporsiyalari", amaliy: [11] },
  { n: 15, b: 6, title: "Uç ölçovli obyektlarni teksturalaş texnologiyalari", short: "Teksturalaş", lab: "UV yoyiş", amaliy: [12] },
  { n: 16, b: 6, title: "Materiallar va shaderlar texnologiyalari", short: "Materiallar va shaderlar", lab: "PBR material laboratoriyasi", amaliy: [13] },
  { n: 17, b: 7, title: "Yoritiş texnologiyalari va sahna taşkil etiş", short: "Yoritiş va sahna", lab: "Yoritiş studiyasi", amaliy: [14] },
  { n: 18, b: 7, title: "Renderlaş texnologiyalari", short: "Renderlaş", lab: "Renderlaş laboratoriyasi", amaliy: [14] },
  { n: 19, b: 8, title: "3D modellarni optimallaştiriş usullari", short: "Optimallaştiriş", lab: "Optimallaştiriş va LOD", amaliy: [15] },
  { n: 20, b: 8, title: "Virtual va kengaytirilgan reallik uçun modellar tayyorlaş", short: "VR va AR uçun modellar", lab: "VR/AR byudjeti", amaliy: [15] },
  { n: 21, b: 8, title: "Uç ölçovli modellarni eksport qiliş va zamonaviy qöllaniliş sohalari", short: "Eksport va qöllaniliş", lab: "Formatlar va öqlar", amaliy: [15] }
];
window.topicInfo = function (n) {
  var t = window.TOPICS[Number(n) - 1];
  if (!t) return null;
  var b = window.BLOCKS[t.b];
  return Object.assign({}, t, { color: b.color, soft: b.soft, blockName: b.name, nn: (t.n < 10 ? "0" : "") + t.n });
};
