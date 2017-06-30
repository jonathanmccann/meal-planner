function realtimeSearch() {
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
}