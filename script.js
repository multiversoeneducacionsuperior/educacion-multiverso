import { db } from './firebase-init.js';
import {
  ref,
  push,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

const preguntasRef = ref(db, 'preguntas');

const form = document.getElementById('formulario');
const preguntaInput = document.getElementById('pregunta');
const categoriaSelect = document.getElementById('categoria');
const contenedorPreguntas = document.getElementById('contenedor-preguntas');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const pregunta = preguntaInput.value.trim();
  const categoria = categoriaSelect.value;

  if (pregunta === '') return;

  const nuevaPregunta = {
    texto: pregunta,
    categoria: categoria,
    timestamp: Date.now()
  };

  push(preguntasRef, nuevaPregunta);
  preguntaInput.value = '';
});

onValue(preguntasRef, (snapshot) => {
  contenedorPreguntas.innerHTML = '';
  const data = snapshot.val();
  if (data) {
    const preguntasArray = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
    preguntasArray.forEach(([id, pregunta]) => {
      const div = document.createElement('div');
      div.classList.add('pregunta');
      div.innerHTML = `
        <h3>${pregunta.texto}</h3>
        <p><strong>Categoría:</strong> ${pregunta.categoria}</p>
        <button class="eliminar" data-id="${id}">🗑️ Eliminar</button>
        <hr>
      `;
      contenedorPreguntas.appendChild(div);
    });

    document.querySelectorAll('.eliminar').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        remove(ref(db, `preguntas/${id}`));
      });
    });
  }
});
