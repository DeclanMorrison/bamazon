const mysql = require("mysql");
const inquirer = require("inquirer");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "SuperSecretPasswordHere",
  database: "bamazon"
});

inquirer.prompt([
  {
    type: "list",
    name: "user",
    choices: ["Customer", "Manager"],
    message: "Which program would you like to use?"
  }
]).then(answers => {
  switch(answers.user){
    case ("Customer"):
      customer();
      break;
    
    case ("Manager"):
      console.log(`Welcome, Manager!`);
      manager();
      break;
  };
});

const customer = () => {
  console.log("");
  // Display all items
  connection.query(`SELECT * FROM products;`, function(error, results, fields){
    results.forEach(function(value, index){
      console.log(`${value.product_name} for sale at $${value.price}. Item ID: ${value.item_id}.`);
      console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`);
    });

    // Ask user what they would like to buy.
    inquirer.prompt([
      {
        type: "input",
        name: "item_id",
        message: "Please enter the ID of the item you would like to purchase."
      },
      {
        type: "input",
        name: "amount",
        message: "Please enter the quantiy of items to purchase."
      }
    ]).then(answers => {
      // console.log(answers);
      connection.query(`SELECT stock_quantity, price FROM products WHERE item_id=?;`,[answers.item_id], function(err, res) {
        // console.log(res[0].stock_quantity, parseInt(answers.amount, 10));
        if (res[0].stock_quantity >= parseInt(answers.amount, 10)) {
          const newQuantity = res[0].stock_quantity - parseInt(answers.amount, 10);
          connection.query(`UPDATE products SET stock_quantity=? WHERE item_id=?`, [newQuantity, answers.item_id]);
          console.log(`Total Cost: $${res[0].price * answers.amount}. Thank you for your purchase!`);
          customer();
        } else {
          console.log("There is not enough quantity for your purchase. ");
          customer();
        };
      });
    });
  });
};

const manager = () => {
  console.log("");
  inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "What would you like to do?",
      choices: ["View products for sale", "View low inventory (<5)", "Add to inventory", "Add new product"],
    }
  ]).then(answers => {
    switch(answers.choice){
      case ("View products for sale"):
        connection.query(`SELECT * FROM products;`, function(error, results, fields){
          results.forEach(function(value, index){
            console.log(`${value.product_name} for sale at $${value.price}. Item ID: ${value.item_id}.`);
            console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`);
          });
        });
        manager();
        break;

      case ("View low inventory (<5)"):
        connection.query(`SELECT * FROM products WHERE stock_quantity<=5;`, function(err, results){
          results.forEach(function(value, index){
            console.log(`${value.product_name} is low in stock at ${value.stock_quantity} items.`);
            console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-`);
          });
        });
        manager();
        break;

      case ("Add to inventory"):
        inquirer.prompt([
          {
            type: "input",
            name: "item_id",
            message: "Please enter the ID of the item you would like to restock: "
          },
          {
            type: "input",
            name: "amount",
            message: "Please enter the amount to reorder:"
          }
        ]).then(answers => {
          connection.query(`SELECT stock_quantity, product_name FROM products WHERE item_id=?;`, [answers.item_id], function(err, res) {
            const newQuantity = res[0].stock_quantity + parseInt(answers.amount, 10);
            connection.query(`UPDATE products SET stock_quantity=? WHERE item_id=?;`, [newQuantity, answers.item_id]);
            console.log(`${res[0].product_name} has been restocked. New quantity: ${newQuantity}.`);
          });
        }).then(() => {
          manager();
        });
        
        break;

      case ("Add new product"):
        inquirer.prompt([
          {
            type: "input",
            name: "product_name",
            message: "What is the name of the new product?"
          },
          {
            type: "input",
            name: "price",
            message: "What is the price of this product?"
          },
          {
            type: "input",
            name: "stock_quantity",
            message: "How many would you like to stock?"
          },
          {
            type: "input",
            name: "department_name",
            message: "What department does this product belong to?"
          }
        ]).then(answers => {
          connection.query(`INSERT INTO products SET ?;`, [answers]);
          console.log("Product Added!");
        }).then(() => {
          manager();
        });
        break;
    };
  });
};