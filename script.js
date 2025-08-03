let questions = JSON.parse(localStorage.getItem("questions")) || [];

document.addEventListener("DOMContentLoaded", () => {
  renderQuestions();
});

function saveQuestions() {
  localStorage.setItem("questions", JSON.stringify(questions));
}

function renderQuestions() {
  const container = document.getElementById("questions-container");
  const menu = document.getElementById("menu");
  container.innerHTML = "";
  menu.innerHTML = "";

  questions.forEach((q) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="#${q.id}">${q.title.substring(0, 30)}...</a>`;
    menu.appendChild(li);

    const section = document.createElement("section");
    section.className = "question-block";
    section.id = q.id;

    section.innerHTML = `
      <h2 id="title-${q.id}">${q.title}</h2>
      <div class="responses" id="responses-${q.id}"></div>
      <form onsubmit="addComment('${q.id}'); return false;">
        <input type="text" id="author-${q.id}" placeholder="Nombre" required />
        <textarea id="comment-${q.id}" placeholder="Escribe tu aporte..." required></textarea>
        <button type="submit">Agregar comentario</button>
      </form>
      <div class="comment-actions">
        <button class="delete" onclick="showDeleteModal('${q.id}')">Eliminar</button>
        <button class="vote" onclick="showEditModal('${q.id}')">Editar</button>
      </div>
    `;

    container.appendChild(section);
    renderComments(q.id);

    const responses = section.querySelector(".responses");
    const form = section.querySelector("form");
    if (q.comments.length === 0) {
      responses.style.display = "none";
      form.classList.add("no-comments");
    } else {
      responses.style.display = "block";
      form.classList.remove("no-comments");
    }
  });
}

function addNewQuestion() {
  const title = document.getElementById("new-question-title").value.trim();
  if (!title) return;

  const id = "q" + Date.now();
  questions.push({ id, title, comments: [] });
  saveQuestions();
  renderQuestions();

  document.getElementById("new-question-title").value = "";
}

function addComment(qId) {
  const author = document.getElementById(`author-${qId}`).value.trim();
  const text = document.getElementById(`comment-${qId}`).value.trim();
  if (!author || !text) return;

  const q = questions.find(q => q.id === qId);
  q.comments.push({ author, text, votes: 0 });
  saveQuestions();
  renderComments(qId);
  renderQuestions();
}

function renderComments(qId) {
  const q = questions.find(q => q.id === qId);
  const container = document.getElementById(`responses-${qId}`);
  container.innerHTML = "";

  q.comments.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "comment";
    const likedClass = c.votes > 0 ? "liked" : "";
    div.innerHTML = `
      <strong>${c.author}</strong>
      <p>${c.text}</p>
      <small>Votos: ${c.votes}</small>
      <div class="comment-actions">
        <button class="vote ${likedClass}" onclick="voteComment('${qId}', ${i})" title="Me gusta">👍</button>
        <button class="delete" onclick="deleteComment('${qId}', ${i})">✖</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function deleteComment(qId, index) {
  const q = questions.find(q => q.id === qId);
  q.comments.splice(index, 1);
  saveQuestions();
  renderComments(qId);
  renderQuestions();
}

function voteComment(qId, index) {
  const q = questions.find(q => q.id === qId);
  q.comments[index].votes++;
  saveQuestions();
  renderComments(qId);
  showLikeToast();
}

function showLikeToast() {
  const toast = document.createElement("div");
  toast.className = "like-toast";
  toast.innerHTML = "✅ ¡Gracias por tu voto!";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, 2000);
  }, 100);
}

function showDeleteModal(id) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal">
      <h3>¿Deseas eliminar esta pregunta?</h3>
      <button class="confirm" onclick="deleteQuestion('${id}')">Sí, eliminar</button>
      <button class="cancel" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function deleteQuestion(id) {
  questions = questions.filter(q => q.id !== id);
  saveQuestions();
  renderQuestions();
  document.querySelector(".modal-backdrop")?.remove();
}

function showEditModal(id) {
  const q = questions.find(q => q.id === id);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal">
      <h3>Editar pregunta</h3>
      <input type="text" id="edit-title" value="${q.title}" />
      <button class="confirm" onclick="editQuestion('${id}')">Guardar</button>
      <button class="cancel" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function editQuestion(id) {
  const newTitle = document.getElementById("edit-title").value.trim();
  if (!newTitle) return;

  const q = questions.find(q => q.id === id);
  q.title = newTitle;
  saveQuestions();
  renderQuestions();
  document.querySelector(".modal-backdrop")?.remove();
}
