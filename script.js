import { db } from './firebase-init.js';
import {
  ref,
  push,
  onValue,
  set,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Referencias
const preguntasRef = ref(db, 'preguntas');
const contenedor = document.getElementById('questions-container');
const inputPregunta = document.getElementById('new-question-title');
const btnAgregar = document.querySelector('.new-question-form button');

// Escuchar preguntas en tiempo real
onValue(preguntasRef, (snapshot) => {
  contenedor.innerHTML = '';
  const data = snapshot.val();
  if (data) {
    const preguntas = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
    preguntas.forEach(([id, pregunta]) => renderPregunta(id, pregunta));
  }
});

// Agregar nueva pregunta
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

// Renderizar pregunta
function renderPregunta(id, data) {
  const div = document.createElement('section');
  div.className = 'question-block';
  div.id = id;
  div.innerHTML = `
    <div class="question-actions-row">
      <h2>${data.texto}</h2>
      <div class="actions">
        <button class="edit-question" onclick="editarPregunta('${id}', '${data.texto.replace(/'/g, "\\'")}')">✏️</button>
        <button class="delete-question" onclick="confirmarEliminacion('${id}')">🗑️</button>
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

// Renderizar comentarios
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
      <div style="display:flex; gap:10px;">
        <button onclick="votarComentario('${id}', ${index})">👍</button>
        <button style="background:red;" onclick="eliminarComentario('${id}', ${index})">×</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

// Agregar comentario
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

// Guardar comentario en Firebase
function guardarComentario(id, nuevoComentario) {
  onValue(ref(db, `preguntas/${id}`), (snapshot) => {
    const data = snapshot.val();
    const comentarios = data.comentarios || [];
    comentarios.push(nuevoComentario);
    update(ref(db, `preguntas/${id}`), { comentarios });
  }, { onlyOnce: true });
}

// Votar
window.votarComentario = (id, index) => {
  onValue(ref(db, `preguntas/${id}`), (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.comentarios || !data.comentarios[index]) return;
    data.comentarios[index].votos = (data.comentarios[index].votos || 0) + 1;
    update(ref(db, `preguntas/${id}`), { comentarios: data.comentarios });
  }, { onlyOnce: true });
};

// Eliminar comentario
window.eliminarComentario = (id, index) => {
  onValue(ref(db, `preguntas/${id}`), (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.comentarios) return;
    data.comentarios.splice(index, 1);
    update(ref(db, `preguntas/${id}`), { comentarios: data.comentarios });
  }, { onlyOnce: true });
};

// Crear modal genérico
function crearModal(id, mensaje, onConfirm) {
  const modalFondo = document.createElement('div');
  modalFondo.className = 'modal-backdrop';
  modalFondo.innerHTML = `
    <div class="modal">
      <h3>${mensaje}</h3>
      <button class="confirm">Confirmar</button>
      <button class="cancel">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modalFondo);

  modalFondo.querySelector('.confirm').addEventListener('click', () => {
    onConfirm();
    document.body.removeChild(modalFondo);
  });

  modalFondo.querySelector('.cancel').addEventListener('click', () => {
    document.body.removeChild(modalFondo);
  });
}

// Confirmar eliminación con modal
window.confirmarEliminacion = (id) => {
  crearModal(id, '¿Deseas eliminar esta pregunta?', () => {
    remove(ref(db, `preguntas/${id}`));
  });
};

// Editar pregunta con modal
window.editarPregunta = (id, textoActual) => {
  const modalFondo = document.createElement('div');
  modalFondo.className = 'modal-backdrop';
  modalFondo.innerHTML = `
    <div class="modal">
      <h3>Editar pregunta</h3>
      <input type="text" id="edit-input" value="${textoActual}">
      <button class="confirm">Guardar</button>
      <button class="cancel">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modalFondo);

  modalFondo.querySelector('.confirm').addEventListener('click', () => {
    const nuevo = document.getElementById('edit-input').value.trim();
    if (nuevo !== '') {
      update(ref(db, `preguntas/${id}`), { texto: nuevo });
    }
    document.body.removeChild(modalFondo);
  });

  modalFondo.querySelector('.cancel').addEventListener('click', () => {
    document.body.removeChild(modalFondo);
  });

  // Votar
window.votarComentario = (id, index) => {
  const comentarioRef = ref(db, `preguntas/${id}`);
  
  onValue(comentarioRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.comentarios || !data.comentarios[index]) return;

    // Incrementar el contador de votos
    data.comentarios[index].votos = (data.comentarios[index].votos || 0) + 1;
    update(comentarioRef, { comentarios: data.comentarios });

    // Animación visual del botón de like
    const boton = document.querySelector(`#respuestas-${id} .comment:nth-child(${index + 1}) button`);
    if (boton) {
      boton.classList.add('clicked');
      setTimeout(() => boton.classList.remove('clicked'), 600);
    }

  }, { onlyOnce: true });
};

};
