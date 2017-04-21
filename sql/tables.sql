CREATE TABLE Recipe(
	recipeId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(300),
	ingredients TEXT,
	categoryId INT,
	categoryName VARCHAR(300)
);

CREATE TABLE Category(
	categoryId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(300)
);