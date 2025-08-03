import { db } from './firebase-init.js';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

const questionsRef = collection(db, "questions");

document.addEventListener("DOMContentLoaded", () => {
  onSnapshot(questionsRef, (snapshot) => {
    const questions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({ id: doc.id, ...data });
    });
    renderQuestions(questions);
  });
});

async function addNewQuestion() {
  const title = document.getElementById("new-question-title").value.trim();
  if (!title) return;
  await addDoc(questionsRef, { title, comments: [] });
  document.getElementById("new-question-title").value = "";
}

function renderQuestions(questions) {
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
      <div class="question-actions">
        <button class="delete-question" onclick="confirmDelete('${q.id}')">🗑</button>
        <button class="edit-question" onclick="editQuestionPrompt('${q.id}', '${q.title.replace(/'/g, "\\'")}')">✏️</button>
      </div>
      <h2 id="title-${q.id}">${q.title}</h2>
      <div class="responses" id="responses-${q.id}"></div>
      <form onsubmit="addComment(event, '${q.id}')">
        <input type="text" id="author-${q.id}" placeholder="Nombre" required />
        <textarea id="comment-${q.id}" placeholder="Escribe tu aporte..." required></textarea>
        <button type="submit">Agregar comentario</button>
      </form>
    `;
    container.appendChild(section);
    renderComments(q);
  });
}

async function addComment(event, qId) {
  event.preventDefault();
  const author = document.getElementById(`author-${qId}`).value.trim();
  const text = document.getElementById(`comment-${qId}`).value.trim();
  if (!author || !text) return;

  const qDoc = doc(db, "questions", qId);
  const snapshot = await getDocs(questionsRef);
  const qData = snapshot.docs.find(doc => doc.id === qId).data();

  qData.comments.push({ author, text, votes: 0 });
  await updateDoc(qDoc, { comments: qData.comments });

  document.getElementById(`author-${qId}`).value = "";
  document.getElementById(`comment-${qId}`).value = "";
}

function renderComments(question) {
  const container = document.getElementById(`responses-${question.id}`);
  container.innerHTML = "";

  question.comments.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "comment";
    div.innerHTML = `
      <strong>${c.author}</strong>: ${c.text}
      <small>Votos: ${c.votes}</small>
      <div style="display: flex; gap: 10px;">
        <button onclick="voteComment('${question.id}', ${i})">👍</button>
        <button onclick="deleteComment('${question.id}', ${i})" style="background:red;">×</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function voteComment(qId, index) {
  const qDoc = doc(db, "questions", qId);
  const snapshot = await getDocs(questionsRef);
  const qData = snapshot.docs.find(doc => doc.id === qId).data();
  qData.comments[index].votes++;
  await updateDoc(qDoc, { comments: qData.comments });
}

async function deleteComment(qId, index) {
  const qDoc = doc(db, "questions", qId);
  const snapshot = await getDocs(questionsRef);
  const qData = snapshot.docs.find(doc => doc.id === qId).data();
  qData.comments.splice(index, 1);
  await updateDoc(qDoc, { comments: qData.comments });
}

function confirmDelete(id) {
  if (confirm("¿Estás seguro de eliminar esta pregunta?")) {
    deleteQuestion(id);
  }
}

async function deleteQuestion(id) {
  const qDoc = doc(db, "questions", id);
  await deleteDoc(qDoc);
}

async function editQuestionPrompt(id, currentTitle) {
  const newTitle = prompt("Editar título:", currentTitle);
  if (newTitle && newTitle.trim() !== "") {
    const qDoc = doc(db, "questions", id);
    await updateDoc(qDoc, { title: newTitle.trim() });
  }
}

window.addNewQuestion = addNewQuestion;
window.addComment = addComment;
window.voteComment = voteComment;
window.deleteComment = deleteComment;
window.confirmDelete = confirmDelete;
window.editQuestionPrompt = editQuestionPrompt;
