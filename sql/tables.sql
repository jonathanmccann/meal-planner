CREATE TABLE Category(
	categoryId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	name VARCHAR(300)
);

CREATE TABLE Calendar(
	userId INT NOT NULL,
	recipeId INT,
	mealKey VARCHAR(2)
);

CREATE TABLE MealPlan(
	mealPlanId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	name VARCHAR(300)
);

CREATE TABLE MealPlanRecipe(
	mealPlanId INT NOT NULL,
	userId INT NOT NULL,
	recipeId INT NOT NULL,
	mealKey VARCHAR(2) NOT NULL
);

CREATE TABLE Recipe(
	recipeId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	userId INT NOT NULL,
	name VARCHAR(300),
	ingredients TEXT,
	directions TEXT,
	categoryId INT,
	categoryName VARCHAR(300),
	shareHash VARCHAR(100)
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
	subscriptionStatus INT DEFAULT 2
);

CREATE INDEX CALENDAR_IX_USERID_RECIPEID_MEALKEY ON Calendar(userId, recipeId, mealKey);