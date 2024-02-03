import { getDatabase, ref, set, push, child } from 'firebase/database';

function addRecipeForCurrentUser(recipe) {
    const db = getDatabase();
    const userId = auth.currentUser.uid;
    const userRecipesRef = ref(db, 'users/' + userId + '/recipes');

    // Use push to create a new recipe under 'recipes' node, this generates a unique key for each recipe
    const newRecipeRef = push(userRecipesRef);
    set(newRecipeRef, recipe)
    .then(() => {
        console.log("Recipe added successfully!");
    }).catch((error) => {
        console.error("Error adding recipe:", error);
    });
}