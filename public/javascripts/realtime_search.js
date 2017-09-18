function realtimeSearch() {
	var categories;
  var filter;
  var recipes;
	var searchInput;

	searchInput = document.getElementById('searchInput');

	filter = searchInput.value.toLowerCase();

	recipes = document.getElementById("recipes").getElementsByTagName("label");

	for (var i = 0; i < recipes.length; i++) {
		recipe = recipes[i];

		if (recipe.textContent.toLowerCase().indexOf(filter) > -1) {
			recipes[i].style.display = "";
		}
		else {
			recipes[i].style.display = "none";
		}
	}

	categories = document.getElementsByClassName("source-container");

	for (var i = 0; i < categories.length; i++) {
		var categoryRecipes = categories[i].getElementsByTagName("label");

		var hideHeader = true;

		for (var j = 0; j < categoryRecipes.length; j++) {
			if (categoryRecipes[j].style.display !== "none") {
				hideHeader = false;

				break;
			}
		}

		if (hideHeader) {
			categories[i].style.display = "none";
		}
		else {
			categories[i].style.display = "";
		}
	}
}