import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  onSnapshot,
  deleteDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let dadosInventario = [];
let produtosPivot = {};

async function carregarPivot() {
  try {
    const resposta = await fetch("pivot.xlsx");
    const arquivo = await resposta.arrayBuffer();

    const workbook = XLSX.read(arquivo, { type: "array" });
    const primeiraAba = workbook.SheetNames[0];
    const dados = XLSX.utils.sheet_to_json(workbook.Sheets[primeiraAba]);

    produtosPivot = {};

    dados.forEach(item => {
      const valores = Object.values(item);
      const codigo = String(valores.find(v => String(v).startsWith("78")) || "").trim();

      if (codigo) {
        produtosPivot[codigo] = item;
      }
    });

  } catch (erro) {
    console.log("pivot.xlsx não encontrado ou com erro.", erro);
  }
}

window.salvarCodigo = async function(codigo) {
  codigo = String(codigo).trim();

  if (!codigo.startsWith("78")) return;

  const ref = doc(db, "inventario", codigo);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      quantidade: increment(1)
    });
  } else {
    await setDoc(ref, {
      codigo: codigo,
      quantidade: 1,
      data: new Date().toLocaleString("pt-BR")
    });
  }
};

window.alterarQuantidade = async function(codigo, valor) {
  const ref = doc(db, "inventario", codigo);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const item = snap.data();
  const novaQuantidade = item.quantidade + valor;

  if (novaQuantidade <= 0) {
    await deleteDoc(ref);
  } else {
    await updateDoc(ref, {
      quantidade: increment(valor)
    });
  }
};

window.listarInventario = async function() {
  await carregarPivot();

  const ref = collection(db, "inventario");

  onSnapshot(ref, snapshot => {
    dadosInventario = [];

    snapshot.forEach(docItem => {
      dadosInventario.push(docItem.data());
    });

    renderizarInventario();
  });
};

window.renderizarInventario = function() {
  const lista = document.getElementById("lista");
  const total = document.getElementById("total");
  const pesquisa = document.getElementById("pesquisa")?.value.toLowerCase().trim() || "";

  lista.innerHTML = "";

  let totalPecas = 0;
  let encontrados = 0;

  dadosInventario.forEach(item => {
    totalPecas += item.quantidade;

    const infoProduto = produtosPivot[item.codigo] || {};

    const textoBusca = JSON.stringify({
      codigo: item.codigo,
      ...infoProduto
    }).toLowerCase();

    if (pesquisa && !textoBusca.includes(pesquisa)) return;

    encontrados++;

    let detalhes = "";

    Object.entries(infoProduto).forEach(([chave, valor]) => {
      detalhes += `<small><strong>${chave}:</strong> ${valor}</small><br>`;
    });

    lista.innerHTML += `
      <div class="item">
        <strong>Código:</strong> ${item.codigo}<br>
        ${detalhes || "<small>Produto não encontrado no pivot.xlsx</small><br>"}

        <div class="controle-qtd">
          <button onclick="alterarQuantidade('${item.codigo}', -1)">-</button>
          <span>${item.quantidade}</span>
          <button onclick="alterarQuantidade('${item.codigo}', 1)">+</button>
        </div>
      </div>
    `;
  });

  total.innerText = "Total de peças: " + totalPecas;

  if (encontrados === 0) {
    lista.innerHTML = "<p>Nenhum produto encontrado.</p>";
  }
};

window.limparInventario = async function() {
  if (!confirm("Deseja apagar todo o inventário?")) return;

  const ref = collection(db, "inventario");
  const snapshot = await getDocs(ref);

  for (const item of snapshot.docs) {
    await deleteDoc(doc(db, "inventario", item.id));
  }
};

window.baixarTXT = async function() {
  const ref = collection(db, "inventario");
  const snapshot = await getDocs(ref);

  let conteudo = "";

  snapshot.forEach(docItem => {
    const item = docItem.data();

    for (let i = 0; i < item.quantidade; i++) {
      conteudo += item.codigo + "\n";
    }
  });

  const blob = new Blob([conteudo], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "inventario_democrata.txt";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};
