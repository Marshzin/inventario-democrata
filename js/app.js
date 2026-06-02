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

window.salvarCodigo = async function(codigo) {
  codigo = String(codigo).trim();

  if (!codigo.startsWith("78")) {
    alert("Somente códigos iniciados por 78 podem ser cadastrados.");
    return;
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
      quantidade: 1,
      data: new Date().toLocaleString("pt-BR")
    });
  }
};

window.listarInventario = function() {
  const lista = document.getElementById("lista");
  const total = document.getElementById("total");
  const pesquisa = document.getElementById("pesquisa")?.value.trim() || "";

  const ref = collection(db, "inventario");

  onSnapshot(ref, snapshot => {
    lista.innerHTML = "";

    let totalPecas = 0;
    let encontrados = 0;

    snapshot.forEach(docItem => {
      const item = docItem.data();

      totalPecas += item.quantidade;

      if (!item.codigo.includes(pesquisa)) return;

      encontrados++;

      lista.innerHTML += `
        <div class="item">
          <strong>Código:</strong> ${item.codigo}<br>
          <strong>Quantidade:</strong> ${item.quantidade}
        </div>
      `;
    });

    total.innerText = "Total de peças: " + totalPecas;

    if (encontrados === 0) {
      lista.innerHTML = "<p>Nenhum código encontrado.</p>";
    }
  });
};

window.limparInventario = async function() {
  if (!confirm("Deseja apagar todo o inventário?")) return;

  const ref = collection(db, "inventario");
  const snapshot = await getDocs(ref);

  snapshot.forEach(async item => {
    await deleteDoc(doc(db, "inventario", item.id));
  });
};
