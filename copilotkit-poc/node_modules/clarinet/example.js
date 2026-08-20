var clarinet = require("clarinet")

var parser = clarinet.parser();
parser.onvalue = function (v) {
  console.log("Value: " + v);
};
parser.onkey = function (key) {
  console.log("Key: " + key);
};
parser.onopenobject = function (key) {
  console.log("New Object, first key: " + key);
}
parser.oncloseobject = function () {
  console.log("Close Object");
}
parser.onopenarray = function () {
  console.log("New Array");
}
parser.onclosearray = function () {
  console.log("Close Array");
}
parser.onend = function () {
  console.log('End');
}

parser
  .write('{ "firstName": "John", "lastName": ')
  .write('"Smith", "age" : 25, "address" : { ')
  .write('"streetAddress": "21 2nd Street", "')
  .write('city" : "New York", "state" : "NY",')
  .write('"postalCode" : "10021" }, "phoneNum')
  .write('ber": [ { "type" : "home", "number"')
  .write(': "212 555-1234" }, { "type" : "fax')
  .write('", "number": "646 555-4567" } ] }')
  .close();
