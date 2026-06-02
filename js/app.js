function salvarCodigo(codigo) {
  codigo = String(codigo).trim();

  if (codigo === "") return;

  let inventario = JSON.parse(localStorage.getItem("inventario")) || {};

  if (inventario[codigo]) {
    inventario[codigo] += 1;
  } else {
    inventario[codigo] = 1;
  }

  localStorage.setItem("inventario", JSON.stringify(inventario));
}

function listarInventario() {
  const lista = document.getElementById("lista");
  const total = document.getElementById("total");
  const pesquisa = document.getElementById("pesquisa").value.trim();

  const inventario = JSON.parse(localStorage.getItem("inventario")) || {};

  lista.innerHTML = "";

  const codigos = Object.keys(inventario).filter(codigo =>
    codigo.includes(pesquisa)
  );

  let totalPecas = 0;

  Object.values(inventario).forEach(qtd => {
    totalPecas += qtd;
  });

  total.innerText = "Total de peças: " + totalPecas;

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
  if (confirm("Deseja apagar todo o inventário?")) {
    localStorage.removeItem("inventario");
    listarInventario();
  }
}
