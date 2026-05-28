function salvarCodigo() {
  const campo = document.getElementById("codigo");
  const codigo = campo.value.trim();

  if (codigo === "") {
    alert("Digite ou bipe um código.");
    return;
  }

  let inventario = JSON.parse(localStorage.getItem("inventario")) || {};

  if (inventario[codigo]) {
    inventario[codigo] += 1;
  } else {
    inventario[codigo] = 1;
  }

  localStorage.setItem("inventario", JSON.stringify(inventario));

  document.getElementById("mensagem").innerText =
    "Código salvo: " + codigo + " | Quantidade: " + inventario[codigo];

  campo.value = "";
  campo.focus();
}

function listarInventario() {
  const lista = document.getElementById("lista");
  const pesquisa = document.getElementById("pesquisa")?.value.trim() || "";
  const inventario = JSON.parse(localStorage.getItem("inventario")) || {};

  lista.innerHTML = "";

  const codigos = Object.keys(inventario).filter(codigo =>
    codigo.includes(pesquisa)
  );

  if (codigos.length === 0) {
    lista.innerHTML = "<p>Nenhum código encontrado.</p>";
    return;
  }

  codigos.forEach(codigo => {
    lista.innerHTML += `
      <div class="item">
        <strong>Código:</strong> ${codigo}<br>
        <strong>Quantidade:</strong> ${inventario[codigo]}
      </div>
    `;
  });
}

function limparInventario() {
  if (confirm("Deseja realmente limpar todo o inventário?")) {
    localStorage.removeItem("inventario");
    listarInventario();
  }
}