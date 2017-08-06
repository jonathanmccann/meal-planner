CREATE TABLE Category(
	categoryId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	name VARCHAR(300)
);

CREATE TABLE Calendar(
	calendarId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	recipeId INT,
	recipeName VARCHAR(300),
	mealKey VARCHAR(2)
);

CREATE TABLE Recipe(
	recipeId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	name VARCHAR(300),
	ingredients TEXT,
	categoryId INT,
	categoryName VARCHAR(300)
);

CREATE TABLE User_(
	userId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	emailAddress VARCHAR(300),
	password VARCHAR(300),
	wunderlistAccessToken VARCHAR(300),
	wunderlistListId VARCHAR(30)
);