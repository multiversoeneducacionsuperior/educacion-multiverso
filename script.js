import { db } from './firebase-init.js';
import {
  ref,
  push,
  onValue,
  set,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const preguntasRef = ref(db, 'preguntas');
const contenedor = document.getElementById('questions-container');
const inputPregunta = document.getElementById('new-question-title');
const btnAgregar = document.querySelector('.new-question-form button');
const menu = document.getElementById('menu');

let preguntaAEliminar = null;
let comentarioAEliminar = { id: null, index: null };

function showToast(text) {
  const toast = document.getElementById('like-toast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

onValue(preguntasRef, (snapshot) => {
  contenedor.innerHTML = '';
  menu.innerHTML = '';
  const data = snapshot.val();
  if (data) {
    const preguntas = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
    preguntas.forEach(([id, pregunta]) => {
      renderPregunta(id, pregunta);
      renderEnlaceMenu(id, pregunta.texto);
    });
  }
});

btnAgregar.addEventListener('click', () => {
  const texto = inputPregunta.value.trim();
  if (!texto) return;
  const nueva = {
    texto,
    comentarios: [],
    timestamp: Date.now()
  };
  const nuevaRef = push(preguntasRef);
  set(nuevaRef, nueva);
  inputPregunta.value = '';
});

function renderPregunta(id, data) {
  const div = document.createElement('section');
  div.className = 'question-block';
  div.id = id;
  div.innerHTML = `
    <div class="question-actions-row">
      <h2>${data.texto}</h2>
      <div class="actions">
        <button class="edit-question" data-id="${id}" data-texto="${data.texto}">✏️</button>
        <button class="delete-question" data-id="${id}">🗑️</button>
      </div>
    </div>
    <div class="responses" id="respuestas-${id}">
      ${data.comentarios && data.comentarios.length > 0 ? '<h3>Comentarios anteriores</h3>' : ''}
    </div>
    <form onsubmit="return agregarComentario(event, '${id}')">
      <input type="text" id="autor-${id}" placeholder="Nombre" required />
      <textarea id="comentario-${id}" placeholder="Escribe tu aporte..." required></textarea>
      <input type="file" id="archivo-${id}" />
      <button type="submit">Agregar comentario</button>
    </form>
  `;
  contenedor.appendChild(div);
  renderComentarios(id, data.comentarios || []);
}

function renderComentarios(id, comentarios) {
  const contenedor = document.getElementById(`respuestas-${id}`);
  contenedor.innerHTML = comentarios.length > 0 ? '<h3>Comentarios anteriores</h3>' : '';
  comentarios.forEach((comentario, index) => {
    const div = document.createElement('div');
    div.className = 'comment';
    const archivo = comentario.archivoURL ? `<br><a href="${comentario.archivoURL}" target="_blank">📎 Ver archivo</a>` : '';
    div.innerHTML = `
      <strong>${comentario.autor}</strong>: ${comentario.texto}${archivo}
      <small>Votos: ${comentario.votos || 0}</small>
      <div style="display:flex; gap:10px;" class="comment-actions">
        <button class="vote" data-id="${id}" data-index="${index}">👍</button>
        <button class="delete" data-id="${id}" data-index="${index}">×</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

window.agregarComentario = async (e, id) => {
  e.preventDefault();
  const autor = document.getElementById(`autor-${id}`).value.trim();
  const texto = document.getElementById(`comentario-${id}`).value.trim();
  const archivoInput = document.getElementById(`archivo-${id}`);
  const archivo = archivoInput.files[0];
  const comentario = { autor, texto, votos: 0 };
  if (!autor || !texto) return;
  if (archivo) {
    const reader = new FileReader();
    reader.onloadend = () => {
      comentario.archivoURL = reader.result;
      guardarComentario(id, comentario);
    };
    reader.readAsDataURL(archivo);
  } else {
    guardarComentario(id, comentario);
  }
  document.getElementById(`autor-${id}`).value = '';
  document.getElementById(`comentario-${id}`).value = '';
  archivoInput.value = '';
};

function guardarComentario(id, nuevoComentario) {
  onValue(ref(db, `preguntas/${id}`), (snapshot) => {
    const data = snapshot.val();
    const comentarios = data.comentarios || [];
    comentarios.push(nuevoComentario);
    update(ref(db, `preguntas/${id}`), { comentarios });
  }, { onlyOnce: true });
}

function renderEnlaceMenu(id, texto) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = `#${id}`;
  a.innerText = texto;
  li.appendChild(a);
  menu.appendChild(li);
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('vote')) {
    const id = e.target.dataset.id;
    const index = parseInt(e.target.dataset.index);
    onValue(ref(db, `preguntas/${id}`), (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.comentarios || !data.comentarios[index]) return;
      data.comentarios[index].votos = (data.comentarios[index].votos || 0) + 1;
      update(ref(db, `preguntas/${id}`), { comentarios: data.comentarios });
      showToast("¡Gracias por tu voto!");
    }, { onlyOnce: true });
  }

  if (e.target.classList.contains('delete')) {
    comentarioAEliminar.id = e.target.dataset.id;
    comentarioAEliminar.index = parseInt(e.target.dataset.index);
    openModal('comment-delete-modal');
  }

  if (e.target.classList.contains('edit-question')) {
    const id = e.target.dataset.id;
    const textoActual = e.target.dataset.texto;
    const nuevo = prompt("Editar pregunta:", textoActual);
    if (nuevo && nuevo.trim() !== '') {
      update(ref(db, `preguntas/${id}`), { texto: nuevo.trim() });
    }
  }

  if (e.target.classList.contains('delete-question')) {
    preguntaAEliminar = e.target.dataset.id;
    openModal('delete-modal');
  }
});

document.getElementById('confirm-delete').addEventListener('click', () => {
  if (preguntaAEliminar) {
    remove(ref(db, `preguntas/${preguntaAEliminar}`));
    closeModal('delete-modal');
    preguntaAEliminar = null;
  }
});

document.getElementById('confirm-comment-delete').addEventListener('click', () => {
  const { id, index } = comentarioAEliminar;
  onValue(ref(db, `preguntas/${id}`), (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.comentarios) return;
    data.comentarios.splice(index, 1);
    update(ref(db, `preguntas/${id}`), { comentarios: data.comentarios });
    closeModal('comment-delete-modal');
    comentarioAEliminar = { id: null, index: null };
  }, { onlyOnce: true });
});
