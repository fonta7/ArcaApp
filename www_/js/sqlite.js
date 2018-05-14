//////////////////////////////////////////////////
// SQLITE
//////////////////////////////////////////////////

//funzione per creare il nuovo db
function createDB(){
  
  var view_log=true;
  
  if(view_log) $("#sqlite_response").append('LOG CREAZIONE DB:<br/>');
  
  //create new db
  var myDB = window.sqlitePlugin.openDatabase({name: "arca.db", location: 'default'});
  
  alert(myDB);
  
  //create table USERS
  myDB.transaction(function(transaction) {
    
    var sql = "CREATE TABLE IF NOT EXISTS users ( " +
              "id integer primary key, " +
              "codice_agente varchar(12), " +
              "nome varchar(50), " +
              "cognome varchar(50), " +
              "email varchar(100), " +
              "session_id varchar(50), " +
              "last_db_update timestamp " +
              ")";
    
    transaction.executeSql(sql, [],
      function(tx, result) {
        var msg_log = 'TABLE USER CREATED SUCCESSFULLY';
        console.log(msg_log + ' >> ' + result);
        $("#sqlite_response").append(msg_log + '<br/>');
      },
      function(error) {
        alert("Error occurred while creating the table:\n" + error);
      }
    );
    
  });
  
  //create table CLIENTI
  
  //create table ARTICOLI
  
  //create table ORDINI  
  
}
