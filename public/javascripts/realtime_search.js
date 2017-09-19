function hideElements(container, tag) {
	var filter;
  var elements;
	var searchInput;

	searchInput = document.getElementById('searchInput');

	filter = searchInput.value.toLowerCase().trim();

	elements = document.getElementById(container).getElementsByTagName(tag);

	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];

		if (element.textContent.toLowerCase().indexOf(filter) > -1) {
			element.style.display = "";
		}
		else {
			element.style.display = "none";
		}
	}
}

function hideHeaders(container, tag) {
	var categories;

	categories = document.getElementsByClassName(container);

	for (var i = 0; i < categories.length; i++) {
		var categoryRecipes = categories[i].getElementsByTagName(tag);

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

function realtimeSearch() {
	hideElements("recipes", "label");

	hideHeaders("source-container", "label");
}

function realtimeCategorySearch() {
  hideElements("search", "li");
}

function realtimeRecipeSearch() {
  hideElements("search", "li");

  hideHeaders("categories-container", "li");
}