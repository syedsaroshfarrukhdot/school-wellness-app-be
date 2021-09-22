var express = require("express");
const _ = require("lodash");
const { extend } = require("lodash");
const moment = require("moment");
var router = express.Router();
const { AnswerSpanish } = require("../../model/answersSpanish");
const { QuestionSpanish } = require("../../model/questionSpanish");
const { User } = require("../../model/user");
const auth = require("../../middlewares/auth");
const adminEmail = require("../../email/adminEmail");

/* Get All Designations And Users */
router.get("/", auth, async (req, res) => {
  let page = Number(req.query.page ? req.query.page : 1);
  let perPage = Number(req.query.perPage ? req.query.perPage : 10);
  let skipRecords = perPage * (page - 1);
  let requestObject = {};
  let startMonth = req.query.startMonth ? req.query.startMonth : "";
  var startDate = moment(2021 + "-" + startMonth + "-" + 02 + " 00:00:00");
  var endDate = startDate.clone().endOf("month");

  if (startMonth != "") {
    console.log("else", startMonth);
    let monthDATE = {};
    monthDATE.$gte = startDate;
    monthDATE.$lte = endDate;
    requestObject.createdAt = monthDATE;
  }
  let answer = await AnswerSpanish.find(requestObject)
    .populate("user")
    .populate("questionSpanish")
    .sort({
      createdAt: -1,
    });

  return res.send(answer);
});

/*Add New Answers*/
router.post("/", async (req, res) => {
  try {
    let user = await User.findById(req.body.user);
    var currentTime = new Date();
    let answer = await AnswerSpanish.find({
      user: req.body.user,
      createdAt: {
        $gte: moment(currentTime).startOf("day").toDate(),
      },
    });
    console.log(answer);

    if (user && answer.length === 0) {
      let question = new QuestionSpanish();
      question.QuestionOne = req.body.QuestionOne;
      question.QuestionTwo = req.body.QuestionTwo;
      question.QuestionThree = req.body.QuestionThree;
      question.QuestionFour = req.body.QuestionFour;
      question
        .save()
        .then((resp) => {
          answer = new AnswerSpanish();
          answer.user = req.body.user;
          answer.questionSpanish = resp._id;
          answer.AnswerOne = req.body.AnswerOne;
          answer.AnswerTwo = req.body.AnswerTwo;
          answer.AnswerThree = req.body.AnswerThree;
          answer.AnswerFour = req.body.AnswerFour;
          answer.LastName = req.body.LastName;
          answer.Grade = req.body.Grade;
          // answer.Name = req.body.Name;
          answer.Phone = req.body.Phone;
          answer.PersonComp = req.body.PersonComp;
          answer.Purpose = req.body.Purpose;

          if (
            req.body.AnswerOne === "No" ||
            req.body.AnswerTwo === "Yes" ||
            req.body.AnswerThree === "Yes" ||
            req.body.AnswerFour === "Yes"
          ) {
            adminEmail(
              "Covid Symptoms Alert",
              `<h3>User Deatils</h3><br>
               Name : ${req.body.LastName}<br>
               Name Person Completeing Screening : ${req.body.PersonComp}<br>
               Phone = ${req.body.Phone}<br>
               Purpose = ${req.body.Purpose}<br>
               Grade = ${req.body.Grade}<brr>

              
              
              Question 1 = ${req.body.AnswerOne} <br> Question 2 = ${req.body.AnswerTwo} <br> Question 3 = ${req.body.AnswerThree} <br> Question 4 = ${req.body.AnswerFour}`
            );
          }
          answer
            .save()
            .then((resp) => {
              return res.send(resp);
              console.log("Last Name", req.body.LastName);
            })
            .catch((err) => {
              return res.status(500).send({ error: err });
            });
        })

        .catch((err) => {
          return res.status(500).send({ error: err });
        });
    } else {
      return res.status(400).send("Expired Link Or Already Submitted Today");
    }
  } catch {
    return res.status(400).send("Expired Link Or Already Submitted Today"); // when id is inavlid
  }
});

// Update Answers
router.put("/:id", auth, async (req, res) => {
  try {
    let answer = await AnswerSpanish.findById(req.params.id);
    console.log(answer);
    if (!answer)
      return res.status(400).send("Answer with given id is not present");
    answer = extend(answer, req.body);
    await answer.save();
    return res.send(answer);
  } catch {
    return res.status(400).send("Invalid Answer Id"); // when id is inavlid
  }
});

// Delete Answers
router.delete("/monthly", async (req, res) => {
  let newDate = new Date();
  var first_date = new Date(newDate.getFullYear(), newDate.getMonth() - 1, 2);
  var last_date = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
  console.log("mnth", last_date);
  console.log("mnth1", first_date);

  try {
    let answer1 = await AnswerSpanish.deleteMany({
      createdAt: {
        $lte: last_date,
        $gte: first_date,
      },
    });

    console.log("Answer1", answer1);
    if (!answer1) {
      return res.status(400).send("No Records To Delete In Previous Month"); // when there is no id in db
    }
    return res.send(answer1); // when everything is okay
  } catch (err) {
    console.log("error", err);
    return res.status(400).send("Error"); // when id is inavlid
  }
});

module.exports = router;
