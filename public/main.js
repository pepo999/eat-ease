import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
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
const auth = getAuth(app);
const user = auth.currentUser



function signInUser(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      displayRecipesForCurrentUser(user.uid);
    })
    .catch((error) => {
      // console.error("Error signing in:", error);
      const signMsg = document.getElementById('signin-message')
      signMsg.innerHTML = ''
      signMsg.textContent = 'No account found with that username or password. Try again';
    });
}

document.addEventListener('DOMContentLoaded', function() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const signInForm = document.getElementById('signInForm');
  const signMsg = document.getElementById('signin-message')
  signMsg.innerHTML = ''

  function signUpUser(email, password) {
      createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
              const user = userCredential.user;
              displayRecipesForCurrentUser(user.uid);
          })
          .catch((error) => {
              // console.error("Error signing up:", error);
              const signMsg = document.getElementById('signin-message')
              signMsg.innerHTML = ''
              signMsg.textContent = 'Something went wrong'             
          });
  }

  signInForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const isSignUp = signInForm.getAttribute('data-mode') === 'signup';

      if (isSignUp) {
          const confirmPassword = document.getElementById('confirmPassword').value;
          if (password === confirmPassword) {
              signUpUser(email, password);
          } else {
              // console.error("Passwords do not match.");
              const signMsg = document.getElementById('signin-message')
              signMsg.textContent = 'Passwords do not match'
          }
      } else {
          signInUser(email, password); 
      }
  });

  const signInButton = document.querySelector('.signin-signup button:first-child');
  const signUpButton = document.querySelector('.signin-signup button:last-child');
  const modalTitle = document.querySelector('#signInModal p');

  signInButton.addEventListener('click', function() {
      modalTitle.innerText = 'Sign In';
      signInButton.style.borderBottom = 'none'
      signUpButton.style.borderBottom = 'solid 2px'
      signInForm.setAttribute('data-mode', 'signin');
      signInForm.innerHTML = `
          Email: <input type="email" id="email">
          Password: <input type="password" id="password">
          <button type="submit">Login</button>
      `;
      const signMsg = document.getElementById('signin-message')
      signMsg.innerHTML = ''
  });

  signUpButton.addEventListener('click', function() {
      modalTitle.innerText = 'Sign Up';
      signInButton.style.borderBottom = 'solid 2px'
      signUpButton.style.borderBottom = 'none'
      signInForm.setAttribute('data-mode', 'signup');
      signInForm.innerHTML = `
          Email: <input type="email" id="email">
          Password: <input type="password" id="password">
          Confirm Password: <input type="password" id="confirmPassword">
          <button type="submit">Register</button>
      `;
      const signMsg = document.getElementById('signin-message')
      signMsg.innerHTML = ''
  });
  
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
  const db = getFirestore();
  selectedSeason = getCurrentSeason(currentMonth);
  const date = new Date(currentYear, currentMonth, new Date().getDate());
  selectedDay = date.getDay() === 0 ? 7 : date.getDay();
  const userRecipesRef = collection(db, 'users', userId, 'recipes');
  const q = query(userRecipesRef, where('season', 'array-contains', selectedSeason));
  // const dayHTML = document.getElementById('selectedDay')
  // dayHTML.innerHTML = selectedDay
  // const monthHTML = document.getElementById('selectedMonth')
  // monthHTML.innerHTML = currentMonth
  try {
    const querySnapshot = await getDocs(q);
    const recipes = [];
    querySnapshot.forEach((doc) => {
      const recipeData = doc.data();
      if (recipeData.day && recipeData.day.includes(selectedDay)) {
        recipeData.id = doc.id;
        recipes.push(recipeData);
      }
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
    recipe.description = recipe.description || 'No description';
    await addDoc(userRecipesRef, recipe);
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
  const calendarNav = document.getElementById('calendarNav')
  const daysHTML = document.querySelector('.days')
  daysHTML.style.visibility = 'visible'
  calendarContainer.style.visibility = 'visible'
  calendarContainer.innerHTML = ''; 
  calendarContainer.style.height = '25vh'
  calendarNav.style.visibility = 'visible'
  calendarNav.style.height = '3vh'
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
    calendarContainer.style.height = '25vh'
  }
}

createCalendar();

async function openRecipeDetailModal(recipeId) {
  const formElement = document.getElementById('recipeDetailForm');
  formElement.setAttribute('data-recipe-id', recipeId);
  currentRecipeId = recipeId;
  const userId = auth.currentUser.uid;
  if (!userId || !recipeId) {
    // console.error("User ID or Recipe ID is undefined.");
    return;
  }
  const db = getFirestore();
  const recipeRef = doc(db, 'users', userId, 'recipes', currentRecipeId);

  try {
    const docSnap = await getDoc(recipeRef);
    if (docSnap.exists()) {

      const recipe = docSnap.data();
      setDayButtonStates(recipe.day, '.day-btn-detail');
      setSeasonButtonStates(recipe.season, '.season-btn-detail');
      document.getElementById('recipeNameDet').value = recipe.name
      // document.getElementById('recipeSeasonDet').value = recipe.season.join(', '); // Convert array to string
      // document.getElementById('recipeDayDet').value = recipe.day.toString();
      const ingredientsContainer = document.getElementById('recipeIngredientsContainer');
      ingredientsContainer.innerHTML = '';
      recipe.ingredients.forEach((ingredient, index) => {
        const ingredientElement = document.createElement('div');
        ingredientElement.classList.add('ingredientRecipeInput')
        ingredientElement.innerHTML = `
                    <input type="text" id="ingredientRecipeName${index}" class="ingredientRecipeName" value="${ingredient.ingredient_name}" />
                    <input type="text" id="ingredientRecipeQuantity${index}" class="ingredientRecipeQuantity" value="${ingredient.quantity}" />
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

function getSelectedSeasons(selector) {
  const selectedSeasons = Array.from(document.querySelectorAll(`${selector}.selected`))
    .map(button => parseInt(button.getAttribute('data-season')));
  return selectedSeasons;
}

function getSelectedDays(selector) {
  const selectedDays = Array.from(document.querySelectorAll(`${selector}.selected`))
    .map(button => parseInt(button.getAttribute('data-day')));
  return selectedDays;
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

  const ingredientElements = document.querySelectorAll('.ingredientRecipeInput');
  const ingredients = Array.from(ingredientElements).map(ingredientElement => {
    return {
      ingredient_name: ingredientElement.querySelector('.ingredientRecipeName').value,
      quantity: ingredientElement.querySelector('.ingredientRecipeQuantity').value
    };
  });
  const updatedRecipe = {
    name: document.getElementById('recipeNameDet').value,
    season: getSelectedSeasons('.season-btn-detail'),
    day: getSelectedDays('.day-btn-detail'),
    ingredients: ingredients,
    description: document.getElementById('recipeDescriptionDet').value
  };

  try {
    await updateDoc(recipeRef, updatedRecipe);
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
  const formElement = document.getElementById('recipeDetailForm');
  // Retrieve the recipeId from the form's data-recipe-id attribute
  const recipeId = formElement.getAttribute('data-recipe-id');

  const userId = auth.currentUser.uid;
  const db = getFirestore();

  // Ensure that recipeId is valid before proceeding
  if (!recipeId) {
    console.error("No recipe ID provided for deletion.");
    return;
  }

  const recipeRef = doc(db, 'users', userId, 'recipes', recipeId);

  try {
    await deleteDoc(recipeRef);
    document.getElementById('recipeDetailModal').style.display = 'none';
    displayRecipesForSelectedDay(selectedDay, selectedSeason)
  } catch (error) {
    console.error("Error deleting recipe:", error);
  }
});

async function displayRecipesForSelectedDay(selectedDay, selectedSeason) {
  const userId = auth.currentUser.uid;
  const db = getFirestore();
  const userRecipesRef = collection(db, 'users', userId, 'recipes');
  // const q = query(userRecipesRef, where('season', 'array-contains', selectedSeason), where('day', '==', selectedDay));
  const q = query(userRecipesRef, where('season', 'array-contains', selectedSeason));
  try {
    const querySnapshot = await getDocs(q);
    const recipes = [];

    querySnapshot.forEach((doc) => {
      const recipeData = doc.data();
      if (recipeData.day.includes(selectedDay)) {
        recipeData.id = doc.id;
        recipes.push(recipeData);
      }
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
  setupSeasonButtons()
  setupDayButtons()
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
    day: getSelectedDays('.day-btn'),
    ingredients: ingredients,
    // day: document.getElementById('recipeDay').value, // Keep as string for now
    description: document.getElementById('recipeDescription').value
  };

  addNewRecipe(auth.currentUser.uid, recipe);
  document.getElementById('addRecipeModal').style.display = 'none';
});

document.getElementById('addIngredientBtn').addEventListener('click', function () {
  const container = document.getElementById('ingredientsContainer');
  const newIngredientInput = document.createElement('div');
  newIngredientInput.classList.add('ingredientInput');
  newIngredientInput.innerHTML = `
      <input type="text" class="ingredientName">
      <input type="text" class="ingredientQuantity">
  `;
  container.appendChild(newIngredientInput);
});

document.getElementById('removeIngredientBtn').addEventListener('click', function () {
  const container = document.getElementById('ingredientsContainer');
  const ingredientInputs = container.querySelectorAll('.ingredientInput');
  if (ingredientInputs.length > 0) {
    const lastIngredientInput = ingredientInputs[ingredientInputs.length - 1];
    container.removeChild(lastIngredientInput);
  }
});

document.getElementById('addRecipeIngredientBtn').addEventListener('click', function () {
  const container = document.getElementById('recipeIngredientsContainer');
  const newIngredientInput = document.createElement('div');
  newIngredientInput.classList.add('ingredientRecipeInput');
  newIngredientInput.innerHTML = `
      <input type="text" class="ingredientRecipeName">
      <input type="text" class="ingredientRecipeQuantity">
  `;
  container.appendChild(newIngredientInput);
});

document.getElementById('removeRecipeIngredientBtn').addEventListener('click', function () {
  const container = document.getElementById('recipeIngredientsContainer');
  const ingredientInputs = container.querySelectorAll('.ingredientRecipeInput');
  if (ingredientInputs.length > 0) {
    const lastIngredientInput = ingredientInputs[ingredientInputs.length - 1];
    container.removeChild(lastIngredientInput);
  }
});

function toggleSeasonSelection(button) {
  button.classList.toggle('selected');
}

function toggleDaySelection(button) {
  button.classList.toggle('selected');
}

document.querySelectorAll('.season-btn.selected').forEach(button => {
  button.addEventListener('click', () => toggleSeasonSelection(button));
});

document.querySelectorAll('.day-btn.selected').forEach(button => {
  button.addEventListener('click', () => toggleDaySelection(button));
});



document.addEventListener('DOMContentLoaded', (event) => {
  setupSeasonButtons();
  setupDayButtons()
});

function setupSeasonButtons() {
  document.querySelectorAll('.season-btn').forEach(button => {
    button.onclick = () => button.classList.toggle('selected');
  });
}

function setupDayButtons() {
  document.querySelectorAll('.day-btn').forEach(button => {
    button.onclick = () => button.classList.toggle('selected');
  });
}

function toggleSeasonHighlight() {
  this.classList.toggle('selected');
}

function setSeasonButtonStates(seasons, selector) {
  const seasonButtons = document.querySelectorAll(selector);
  seasonButtons.forEach(button => {
    button.classList.remove('selected');
    if (seasons.includes(parseInt(button.getAttribute('data-season')))) {
      button.classList.add('selected');
    }
    button.removeEventListener('click', toggleSeasonHighlight);
    button.addEventListener('click', toggleSeasonHighlight);
  });
}

function toggleDayHighlight() {
  this.classList.toggle('selected');
}

function setDayButtonStates(days, selector) {
  const dayButtons = document.querySelectorAll(selector);
  dayButtons.forEach(button => {
    button.classList.remove('selected');
    const dayValue = parseInt(button.getAttribute('data-day'));
    if (days.includes(dayValue)) { // Corrected to use `days` (the parameter)
      button.classList.add('selected');
    }
    button.removeEventListener('click', toggleDayHighlight);
    button.addEventListener('click', toggleDayHighlight);
  });
}

document.getElementById('allRecipesBtn').addEventListener('click', async function() {
  const userId = auth.currentUser.uid; // Ensure you have access to the current user's ID
  const db = getFirestore();
  const userRecipesRef = collection(db, 'users', userId, 'recipes');
  const calendarContainer = document.getElementById('calendarContainer');
  const recipeContainer = document.getElementById('recipeContainer');
  calendarContainer.style.visibility = 'hidden'
  calendarContainer.style.height = '0vh'
  recipeContainer.innerHTML = '';
  recipeContainer.style.flexGrow = '10';
  const calendarNav = document.getElementById('calendarNav')
  calendarNav.style.visibility = 'hidden'
  calendarNav.style.height = '0vh'
  const daysHTML = document.querySelector('.days')
  daysHTML.style.visibility = 'hidden'

  try {
    const querySnapshot = await getDocs(userRecipesRef);
    const recipes = [];
    querySnapshot.forEach(doc => {
      const recipe = { id: doc.id, ...doc.data() };
      recipes.push(recipe);
    });

    recipes.sort((a, b) => a.name.localeCompare(b.name));
    recipes.forEach(recipe => {
      const recipeElement = document.createElement('div');
      recipeElement.textContent = recipe.name;
      recipeElement.classList.add('recipe-item'); // Optional: for styling
      recipeElement.setAttribute('data-id', recipe.id); // Store recipe ID for easy access
    
      // Add click event listener to each recipe element
      recipeElement.addEventListener('click', () => {
        openRecipeDetailModal(recipe.id); // Assuming this function exists and opens the detail modal
      });
    
      recipeContainer.appendChild(recipeElement);
    });
  } catch (error) {
    console.error("Error fetching all recipes:", error);
  }
});

function displayMainView() {
  const recipesContainer = document.getElementById('recipeContainer')
  recipesContainer.innerHTML = ''
  createCalendar();
  displayRecipesForCurrentUser(auth.currentUser.uid);
}

document.getElementById('calendarBtn').addEventListener('click', function() {
  displayMainView();
});

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