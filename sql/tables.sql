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
	directions TEXT,
	categoryId INT,
	categoryName VARCHAR(300)
);

CREATE TABLE SharedRecipe(
	hash VARCHAR(100) NOT NULL PRIMARY KEY,
	recipeId INT NOT NULL
);

CREATE TABLE User_(
	userId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	emailAddress VARCHAR(300) NOT NULL UNIQUE,
	password VARCHAR(300),
	passwordResetToken VARCHAR(100),
	passwordResetExpiration INT(11) DEFAULT 0,
	toDoProvider VARCHAR(25),
	accessToken VARCHAR(300),
	listId VARCHAR(30),
	mealsToDisplay INT DEFAULT 7,
	customerId VARCHAR(100),
	subscriptionId VARCHAR(100),
	isSubscribed BOOLEAN DEFAULT 1
);