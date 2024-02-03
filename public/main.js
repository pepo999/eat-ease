import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, set, push, child, onValue } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';


const firebaseConfig = {
  apiKey: "AIzaSyDhtyx7mSyYVL3hqR5o5xpM8S3PjblM8Io",
  authDomain: "eat-ease-d4df4.firebaseapp.com",
  projectId: "eat-ease-d4df4",
  storageBucket: "eat-ease-d4df4.appspot.com",
  messagingSenderId: "170297037833",
  appId: "1:170297037833:web:b79990d92a692447cad4d8",
  measurementId: "G-H5JKS36LL2"
};

const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
const auth = getAuth(app);
const user = auth.currentUser

function signInUser(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log("User signed in:", user);
      // Additional actions on successful sign in
      displayRecipesForCurrentUser(user.uid);
    })
    .catch((error) => {
      console.error("Error signing in:", error);
    });
}

document.getElementById('signInForm').addEventListener('submit', function (event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  signInUser(email, password);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    // console.log("User is signed in:", user);
    document.getElementById('signInModal').style.display = 'none';
    // Additional actions when user is already signed in
    displayRecipesForCurrentUser(user.uid);
  } else {
    // No user is signed in
    // console.log("No user is signed in.");
    document.getElementById('signInModal').style.display = 'block';
  }
});

function signOutUser() {
  signOut(auth).then(() => {
    console.log("User signed out");
  }).catch((error) => {
    console.error("Error signing out:", error);
  });
}

document.getElementById('signOutButton').addEventListener('click', function () {
  signOutUser();
});

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

let currentRecipeId = null;

let selectedDay = null;
let selectedSeason = null;


async function displayRecipesForCurrentUser(userId) {
  selectedSeason = getCurrentSeason(currentMonth);
  const date = new Date(currentYear, currentMonth, new Date().getDay());
  selectedDay = date.getDay() === 0 ? 7 : date.getDay();
  const db = getFirestore();
  const userRecipesRef = collection(db, 'users', userId, 'recipes');
  const q = query(userRecipesRef, where('season', 'array-contains', selectedSeason), where('day', '==', selectedDay));
  try {
    const querySnapshot = await getDocs(q);
    const recipes = [];
    querySnapshot.forEach((doc) => {
      const recipeData = doc.data();
      recipeData.id = doc.id;
      recipes.push(recipeData);
    });
    displayRecipes(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
}

function displayRecipes(recipes) {
  const container = document.getElementById('recipeContainer');
  container.innerHTML = '';

  recipes.forEach((recipe) => {
    const recipeElement = document.createElement('div');
    recipeElement.textContent = `${recipe.name}`;
    recipeElement.addEventListener('click', function () {
      openRecipeDetailModal(recipe.id);
    });
    container.appendChild(recipeElement);
  });
}

async function addNewRecipe(userId, recipe) {
  try {
    const db = getFirestore();
    const userRecipesRef = collection(db, 'users', userId, 'recipes');

    recipe.day = Number(recipe.day);
    recipe.description = recipe.description || 'No description';

    await addDoc(userRecipesRef, recipe);
    console.log("New recipe added successfully");
    console.log(recipe)
    displayRecipesForSelectedDay(selectedDay, selectedSeason);
  } catch (error) {
    console.error("Error adding new recipe:", error);
  }
}

function getCurrentSeason(month) {
  const seasons = [1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 1];
  return seasons[month];
}

function changeMonth(step) {
  currentMonth += step;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateMonthDisplay()
  createCalendar();
}

function updateMonthDisplay() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const selectedMonthName = monthNames[currentMonth];

  const monthDisplayElement = document.getElementById('selectedMonthDisplay');
  monthDisplayElement.textContent = selectedMonthName;
}

updateMonthDisplay();

function createNavigationButtons() {

  const prevBtn = document.getElementById('button-prev');
  prevBtn.onclick = () => changeMonth(-1);

  const nextBtn = document.getElementById('button-next');
  nextBtn.onclick = () => changeMonth(1);

  const monthSpan = document.createElement('span');
  monthSpan.className = 'month-span'
}
function createCalendar() {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarContainer = document.getElementById('calendarContainer');
  calendarContainer.innerHTML = ''; // Clear previous calendar

  createNavigationButtons(); // Create navigation buttons

  const blankCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < blankCells; i++) {
    const blankCell = document.createElement('div');
    blankCell.classList.add('calendarDay', 'empty');
    calendarContainer.appendChild(blankCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('calendarDay');
    dayElement.textContent = day;

    const today = new Date();
    if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      dayElement.classList.add('currentDay'); // Highlight the current day
    }

    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    let selectedSeason = getCurrentSeason(currentMonth);

    dayElement.addEventListener('click', function () {
      const calendarContainer = document.getElementById('calendarContainer');
      calendarContainer.setAttribute('data-selected-day', dayOfWeek);
      calendarContainer.setAttribute('data-selected-season', getCurrentSeason(currentMonth));
      selectedDay = dayOfWeek;
      selectedSeason = getCurrentSeason(currentMonth)
      document.querySelectorAll('.calendarDay').forEach(el => el.classList.remove('selectedDay'));
      dayElement.classList.add('selectedDay');
      displayRecipesForSelectedDay(selectedDay, selectedSeason);
    });

    calendarContainer.appendChild(dayElement);
  }
}

createCalendar();

async function openRecipeDetailModal(recipeId) {
  const formElement = document.getElementById('recipeDetailForm');
  formElement.setAttribute('data-recipe-id', recipeId);
  currentRecipeId = recipeId;
  const userId = auth.currentUser.uid;
  if (!userId || !recipeId) {
    console.error("User ID or Recipe ID is undefined.");
    return;
  }
  const db = getFirestore();
  const recipeRef = doc(db, 'users', userId, 'recipes', currentRecipeId);

  try {
    const docSnap = await getDoc(recipeRef);
    if (docSnap.exists()) {

      const recipe = docSnap.data();
      setSeasonButtonStates(recipe.season, '.season-btn-detail');
     
      document.getElementById('recipeNameDet').value = recipe.name
      // document.getElementById('recipeSeasonDet').value = recipe.season.join(', '); // Convert array to string
      document.getElementById('recipeDayDet').value = recipe.day.toString();
      const ingredientsContainer = document.getElementById('recipeIngredientsContainer');
      ingredientsContainer.innerHTML = ''; // Clear existing contents
      recipe.ingredients.forEach((ingredient, index) => {
        const ingredientElement = document.createElement('div');
        ingredientElement.innerHTML = `
                    <input type="text" id="ingredientName${index}" value="${ingredient.ingredient_name}" />
                    <input type="text" id="ingredientQuantity${index}" value="${ingredient.quantity}" />
                `;
        ingredientsContainer.appendChild(ingredientElement);
      });
      document.getElementById('recipeDescriptionDet').value = recipe.description
      
      document.getElementById('recipeDetailModal').style.display = 'block';
    } else {
      console.log("No such recipe!");
    }
  } catch (error) {
    console.error("Error fetching recipe:", error);
  }
}

document.getElementById('recipeDetailForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  if (isNaN(selectedDay) || isNaN(selectedSeason)) {
    console.error("Selected day or season is not available.");
    return;
  }
  if (selectedDay === null || selectedSeason === null) {
    console.error("Selected day or season is not defined.");
    return;
  }

  const formElement = event.target;
  const recipeId = formElement.getAttribute('data-recipe-id');

  if (!recipeId) {
    console.error("No recipe ID available for updating.");
    return;
  }

  if (!currentRecipeId) {
    console.error("No recipe ID available for updating.");
    return;
  }

  const userId = auth.currentUser.uid;
  const db = getFirestore();
  const recipeRef = doc(db, 'users', userId, 'recipes', currentRecipeId);
  
  const ingredientElements = document.querySelectorAll('.ingredientInput');
  const ingredients = Array.from(ingredientElements).map(ingredientElement => {
    return {
      ingredient_name: ingredientElement.querySelector('.ingredientName').value,
      quantity: ingredientElement.querySelector('.ingredientQuantity').value
    };
  });
  let selectedSeasons = getSelectedSeasons('.season-btn-detail'); 
  const updatedRecipe = {
    name: document.getElementById('recipeNameDet').value,
    season: getSelectedSeasons('.season-btn-detail'),
    ingredients: ingredients,
    day: Number(document.getElementById('recipeDayDet').value), // Keep as string for now
    description: document.getElementById('recipeDescriptionDet').value
  };

  try {
    await updateDoc(recipeRef, updatedRecipe);
    console.log("Recipe updated successfully");
    console.log('up recipe', updatedRecipe)
    console.log('day season', selectedDay, selectedSeason)
    displayRecipesForSelectedDay(selectedDay, selectedSeason);
    document.getElementById('recipeDetailModal').style.display = 'none';

  } catch (error) {
    console.error("Error updating recipe:", error);
  }
});

document.getElementById('doneBtn').addEventListener('click', async function () {
  document.getElementById('recipeDetailModal').style.display = 'none';
})

document.getElementById('deleteRecipeBtn').addEventListener('click', async function () {

  const userId = auth.currentUser.uid;
  const db = getFirestore();
  const recipeRef = doc(db, 'users', userId, 'recipes', recipeId);

  try {
    await deleteDoc(recipeRef);
    console.log("Recipe deleted successfully");
    document.getElementById('recipeDetailModal').style.display = 'none';
  } catch (error) {
    console.error("Error deleting recipe:", error);
  }
});


async function displayRecipesForSelectedDay(selectedDay, selectedSeason) {
  const userId = auth.currentUser.uid;
  const db = getFirestore();
  const userRecipesRef = collection(db, 'users', userId, 'recipes');

  const q = query(userRecipesRef, where('season', 'array-contains', selectedSeason), where('day', '==', selectedDay));
  try {
    const querySnapshot = await getDocs(q);
    const recipes = [];
    querySnapshot.forEach((doc) => {
      const recipeData = doc.data();
      recipeData.id = doc.id;
      recipes.push(recipeData);
    });
    displayRecipes(recipes);
  } catch (error) {
    console.error("Error in displayRecipesForSelectedDay:", error);
  }
}

document.getElementById('addRecipeBtn').addEventListener('click', function () {
  document.getElementById('addRecipeModal').style.display = 'block';
});

document.getElementById('addRecipeForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const ingredientInputs = document.querySelectorAll('.ingredientInput');
  const ingredients = Array.from(ingredientInputs).map(input => {
    return {
      ingredient_name: input.querySelector('.ingredientName').value,
      quantity: input.querySelector('.ingredientQuantity').value
    };
  });

  const recipe = {
    name: document.getElementById('recipeName').value,
    season: getSelectedSeasons('.season-btn'),
    ingredients: ingredients,
    day: document.getElementById('recipeDay').value, // Keep as string for now
    description: document.getElementById('recipeDescription').value // Optional
  };

  addNewRecipe(auth.currentUser.uid, recipe);
  document.getElementById('addRecipeModal').style.display = 'none';
});

document.getElementById('addIngredientBtn').addEventListener('click', function () {
  const container = document.getElementById('ingredientsContainer');
  const newIngredientInput = document.createElement('div');
  newIngredientInput.classList.add('ingredientInput');
  newIngredientInput.innerHTML = `
      Ingredient: <input type="text" class="ingredientName">
      Quantity: <input type="text" class="ingredientQuantity">
  `;
  container.appendChild(newIngredientInput);
});

function toggleSeasonSelection(button) {
  button.classList.toggle('selected');
}

// Attach click event listeners to season buttons
document.querySelectorAll('.season-btn').forEach(button => {
  button.addEventListener('click', () => toggleSeasonSelection(button));
});

// Function to get selected seasons as an array of numbers
function getSelectedSeasons(selector) {
  const selectedButtons = document.querySelectorAll(`${selector}.selected`);
  return Array.from(selectedButtons).map(button => parseInt(button.getAttribute('data-season')));
}

function setSeasonButtonStates(seasons, selector) {
  console.log("Setting season button states:", seasons); // Debugging log

  document.querySelectorAll(selector).forEach(button => {
      const seasonNumber = parseInt(button.getAttribute('data-season'));
      console.log(`Button season: ${seasonNumber}, Is selected: ${seasons.includes(seasonNumber)}`); // Debugging log

      if (seasons.includes(seasonNumber)) {
          button.classList.add('selected');
      } else {
          button.classList.remove('selected');
      }
  });
}


// users (collection)
// │
// └───userId (document)
//     │
//     └───recipes (sub-collection)
//         │   recipe1 (document)
//         │   recipe2 (document)
//         │   ...

// {
//   /* Visit https://firebase.google.com/docs/database/security to learn more about security rules. */
// "rules": {
//   "users": {
//     "$userId": {
//       ".read": "$userId === auth.uid",
//       ".write": "$userId === auth.uid"
//     }
//   }
// }
// }