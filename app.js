//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_DB);




const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);




app.get("/", function (req, res) {

  // Item.find({}, function(err, foundItems){
  //   console.log(foundItems);
  // });

  Item.find({}).then(foundItems => {

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems).then(function () {
          console.log("Successfully saved the default items to the DB...");
        }).catch(function (err) {
          console.log(err);
        });
        res.redirect("/");
      }else{
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(err => {
      // Handle the error here
      console.error(err);
    });

});



// app.post("/", function (req, res) {

//   const itemName = req.body.newItem;
//   const listName = req.body.list;

//   const item = new Item({
//     name : itemName
//   });

//   if(listName === "Today"){
//     item.save();
//     res.redirect("/");
//   }else{
//     List.findOne({name: listName}, function(err, foundList){
//       foundList.items.push(item);
//       foundList.save();
//       res.redirect("/" + listName);
//     });
//   }
// });

/* findOne() function doesn't accepts callback functions anymore, otherwise above code is fine {same for other mongoose functions}*/

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        // Handle the error here
        console.error(err);
        res.status(500).send("An error occurred while processing the request.");
      });
  } else {
    List.findOne({ name: listName })
      .exec()
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        // Handle the error here
        console.error(err);
        res.status(500).send("An error occurred while processing the request.");
      });
  }
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

List.findOne({ name: customListName })
  .exec()
  .then(foundList => {
    if (!foundList) {
      // Create a new list if it doesn't exist
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save()
        .then(() => {
          res.redirect("/" + customListName);
        })
        .catch(err => {
          // Handle the error here
          console.error(err);
        });
    } else {
      // console.log("List with this name already exists!");

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(err => {
    // Handle the error here
    console.error(err);
  });
});




app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .exec()
      .then(deletedItem => {
        if (deletedItem) {
          console.log("Successfully deleted the checked item..");
        } else {
          console.log("Item not found or already deleted.");
        }
        res.redirect("/");
      })
      .catch(err => {
        // Handle the error here
        console.error(err);
        res.status(500).send("An error occurred while processing the request.");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      { new: true }
    )
      .exec()
      .then(updatedList => {
        if (updatedList) {
          console.log("Successfully deleted the checked item from the list..");
        } else {
          console.log("List not found.");
        }
        res.redirect("/" + listName);
      })
      .catch(err => {
        // Handle the error here
        console.error(err);
        res.status(500).send("An error occurred while processing the request.");
      });
  }
});




app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});



//mongodb+srv://abhaydharmale:Mjolnir_mongoose@cluster0.s0bxcrh.mongodb.net/?retryWrites=true&w=majority