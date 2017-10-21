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
	emailAddress VARCHAR(300) NOT NULL UNIQUE,
	password VARCHAR(300),
	accessToken VARCHAR(300),
	listId VARCHAR(30),
	passwordResetToken VARCHAR(100),
	passwordResetExpiration INT(11) DEFAULT 0
);