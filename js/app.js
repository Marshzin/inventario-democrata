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
let pivotCarregado = false;

async function carregarPivot() {
  if (pivotCarregado) return;

  try {
    const resposta = await fetch("pivot.xlsx");
    const arquivo = await resposta.arrayBuffer();

    const workbook = XLSX.read(arquivo, { type: "array" });
    const aba = workbook.SheetNames[0];
    const dados = XLSX.utils.sheet_to_json(workbook.Sheets[aba]);

    produtosPivot = {};

    dados.forEach(item => {
      const codigos = String(item["Códigos de Barras"] || "").trim();
      const descricao = String(item["Descrição Completa"] || "").trim();

      if (!codigos || !descricao) return;

      produtosPivot[codigos] = { descricao };
    });

    pivotCarregado = true;

  } catch (erro) {
    console.error("Erro ao carregar pivot.xlsx", erro);
  }
}

function buscarProduto(codigo) {
  for (const chave in produtosPivot) {
    if (chave.includes(codigo)) {
      return produtosPivot[chave];
    }
  }

  return null;
}

window.obterDescricaoProduto = async function(codigo) {
  await carregarPivot();

  const produto = buscarProduto(codigo);

  if (produto) {
    return produto.descricao;
  }

  return "Produto não encontrado";
};

window.salvarCodigo = async function(codigo) {
  codigo = String(codigo).trim();

  if (
    !codigo.startsWith("78") &&
    !codigo.startsWith("79")
  ) {
    return false;
  }

  await carregarPivot();

  const produto = buscarProduto(codigo);

  if (!produto) {
    return false;
  }

  const ref = doc(db, "inventario", codigo);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      quantidade: increment(1)
    });
  } else {
    await setDoc(ref, {
      codigo: codigo,
      produto: produto.descricao,
      quantidade: 1,
      data: new Date().toLocaleString("pt-BR")
    });
  }

  return true;
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

  const pesquisa =
    document.getElementById("pesquisa")?.value.toLowerCase().trim() || "";

  lista.innerHTML = "";

  let totalPecas = 0;
  let encontrados = 0;

  dadosInventario.forEach(item => {
    totalPecas += item.quantidade;

    const produto = buscarProduto(item.codigo);

    const descricao = produto
      ? produto.descricao
      : item.produto || "Produto não encontrado";

    const textoBusca = (item.codigo + " " + descricao).toLowerCase();

    if (pesquisa && !textoBusca.includes(pesquisa)) return;

    encontrados++;

    lista.innerHTML += `
      <div class="item">
        <strong>Código:</strong> ${item.codigo}<br>
        <strong>Produto:</strong> ${descricao}<br><br>

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

window.limparInventario = async function() {
  if (!confirm("Deseja apagar todo o inventário?")) return;

  const ref = collection(db, "inventario");
  const snapshot = await getDocs(ref);

  for (const item of snapshot.docs) {
    await deleteDoc(doc(db, "inventario", item.id));
  }
};
