//////////////////////////////////////////////////
// VARIABILI
//////////////////////////////////////////////////
var API_PATH = "http://www.arcadistribution.com/tco/api/app/";
var NUMERO_RIGHE_ORDINE = 30;


//////////////////////////////////////////////////
// LOGIN e LOGOUT
//////////////////////////////////////////////////
$("#loginPage").on("pagecreate", function(){
  
  if(localStorage.getItem('credenziali') !== null){
      
    var credenziali = JSON.parse(localStorage.getItem('credenziali'));
    
    if(credenziali.expiration_date*1 >= today()){
      
      document.getElementById('username').value = credenziali.username;
      document.getElementById('password').value = credenziali.password;
      
    }else{
      
      document.getElementById('username').value = "";
      document.getElementById('password').value = "";
      
    }
    
  }
  
});

//funzione di login
$( "#login_form_submit" ).bind( "click", function(){
  
  //resetto il msg response
  $('.response_msg').html("<span class=\"ajax_loader_msg\" >login in corso</span>");
  
  //recupero username e password
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  var md5_password = MD5(password);
  
  //effettuo la chiamata ajax ad arcadistribution.com
  $.ajax({
    url: API_PATH + 'login.php',
    type: "POST",   
    crossDomain: true,
    data: {
      username: username,
      password: md5_password
    },
    success: function(response){
      
      try{
        
        //verifico se il login è stato effettuato correttamente
        if(isJSON(response)){

          //verifico se ho già effettuato il caricamento dei dati nella giornata odierna
          var login = JSON.parse(response);
          var agente = JSON.parse(localStorage.getItem('agente'));

          var import_data = true;         
          if(agente !== null){

            //verifico l'ultima data di login
            if(agente.ultimo_login.substring(0, 10) === login.ultimo_login.substring(0, 10)){
              import_data = false;             
            }
            
          }
          
          //effettuo il salvataggio dei dati json dell'agente nel local storage
          localStorage.setItem('agente', response);
          
          //mostro il messaggio di login
          $('.response_msg').html("<span class='clr-green' >Login effettuato correttamente</span>");
          
          
          //memorizzazione credenziali di accesso
          if(document.getElementById('save_credential').checked === true){
            
            //recupero dallo storage il file con le credenziali salvate
            var aggiorna_credenziali = true;
            if(localStorage.getItem('credenziali') !== null){
                
              var credenziali = JSON.parse(localStorage.getItem('credenziali'));
              if(credenziali.expiration_date*1 >= today()){
                aggiorna_credenziali = false;
              }
                
            }
            
            //se non sono mai state salvate le credenziali o se la data di scadenza è passata
            if(aggiorna_credenziali === true){
              var credenziali_nuove = {};
              credenziali_nuove.username = username;
              credenziali_nuove.password = password;
              
              var date = new Date();
              date.setDate(date.getDate() + 7);
              var dd = date.getDate();
              var mm = date.getMonth()+1; //January is 0!
              var yyyy = date.getFullYear();
              
              //padding di mese e giorno
              if(mm<10) mm = '0' + mm;
              if(dd<10) dd = '0' + dd;
              
              var expiration_date = yyyy + '' + mm + '' + dd;
              credenziali_nuove.expiration_date = expiration_date;
              
              localStorage.setItem('credenziali', JSON.stringify(credenziali_nuove));
            }
            
          }else{
            localStorage.removeItem('credenziali');
          }
          
          
          //reindirizzo all'homepage
          setTimeout(function(){
            
            //verifico se rimandare alla home o alla pagina di importazione
            if(import_data === true){
              location.href="import.html";
            }else{
              //location.href="home.html";
              location.href="home_ordini.html";
            }
            
          }, 2000);
          
        }else{
          $('.response_msg').html("<span class='clr-red' >" + response + "</span>");
        }
        
      }catch(err){
        $('.response_msg').html("<span class='clr-red' >" + err + "</span>");
      }  
  
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      
      //verifico se l'utente si era già loggato ed eventualmente verifico i dati con l'ultimo login effettuato
      if(localStorage.getItem('agente') !== null){
        
        var agente = JSON.parse(localStorage.getItem('agente'));
        
        if(agente.email === username && agente.password === password){

          //mostro il messaggio di login
          $('.response_msg').html("<span class='clr-green' >Login effettuato correttamente</span>");
          
          //reindirizzo all'homepage
          setTimeout(function(){
            location.href="home.html";
          }, 2000);
        
        }
      
      }else{
        $('.response_msg').html("<span class='clr-red' >Impossibile procedere. Per effettuare il primo login &egrave; necessaria una connessione internet.</span>");
      }      
      
    }

  });
  
});


//funzione logout
function logout(){
  
  //effettuo il redirect
  location.href="index.html";
  
}



//////////////////////////////////////////////////
// HOME
//////////////////////////////////////////////////
$("#homePage").on("pagecreate", function( event ){
  
  //recupero le info dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  $('#nome_agente').html(agente.nome + " " + agente.cognome);
  
});



//////////////////////////////////////////////////
// IMPORT
//////////////////////////////////////////////////

//funzione di importazione - STEP1 import clienti
$( "#import_form_submit" ).bind( "click", function(){
  
  //resetto il msg response
  $.mobile.loading( "show", {
    text: "importazione in corso, attendere",
    textVisible: true,
    theme: "",
    html: ""
  });
  
  //resetto il messaggio iniziale alla lista di importazione
  $('.response_msg').html("");
  
  //recupero i dati dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  //se non ho dati per l'agente effettuo il logout
  if (agente === null){
    logout();
  }
  
  var codice_agente = agente.codice;
  var token = agente.token;
  
  console.log('IMPORTAZIONE CLIENTI >> codice:' + codice_agente + ' - token:' + token);

  //recupero via ajax i clienti 
  $.ajax({
    url: API_PATH + 'clienti.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('clienti', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO CLIENTI</h2></li>");
        
        //lancio lo step successivo di importazione
        importArticoli(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO CLIENTI</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });  
  
});

//STEP2 import articoli
function importArticoli(codice_agente, token){
  
  console.log('IMPORTAZIONE ARTICOLI >> codice:' + codice_agente + ' - token:' + token);
  
  $.ajax({
    url: API_PATH + 'articoli.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('articoli', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO ARTICOLI</h2></li>");

        //lancio lo step successivo di importazione
        importOrdiniStorico(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO ARTICOLI</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}

//STEP3 import storico ordini
function importOrdiniStorico(codice_agente, token){
  
  console.log('IMPORTAZIONE STORICO ORDINI >> codice:' + codice_agente + ' - token:' + token);
  
  $.ajax({
    url: API_PATH + 'ordini.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token,
      action: 'elenco_ordini'
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('ordini_storico', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO ORDINI</h2></li>");
        
        //elimino dal local storage eventuale ordine
        localStorage.removeItem('ordine');

        //lancio lo step successivo di importazione
        importOrdiniBozze(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO ORDINI</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}

//STEP4 import storico ordini
function importOrdiniBozze(codice_agente, token){
  
  console.log('IMPORTAZIONE BOZZE ORDINI >> codice:' + codice_agente + ' - token:' + token);
  
  //recupero l'elenco delle bozze ordini attualmente presenti nell'app per la sincronizzazione
  var bozze_app = localStorage.getItem('ordini_bozze');
  console.log(bozze_app);
  
  $.ajax({
    url: API_PATH + 'ordini.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      json_bozze_app: bozze_app,
      token: token,
      action: 'sincronizza_bozze'
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('ordini_bozze', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>SINCRONIZZAZIONE BOZZE</h2></li>");

        //lancio lo step successivo di importazione
        importModalitaPagamento(codice_agente, token);

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>SINCRONIZZAZIONE BOZZE</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}

//STEP5 import modalita pagamento
function importModalitaPagamento(codice_agente, token){
  
  console.log('IMPORTAZIONE MODALITA PAGAMENTO >> codice:' + codice_agente + ' - token:' + token);
  
  $.ajax({
    url: API_PATH + 'modalita_pagamento.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token
    },
    success: function(response){
      
      try{
        
        //effettuo il salvataggio dei dati json dell'agente nel local storage
        localStorage.setItem('pagamento', response);
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO DATI AGGIUNTIVI</h2></li>");

        //recupero via ajax gli articoli
        $.mobile.loading( "hide" );
        
        //effettuo il redirect dopo 1 secondo
        setTimeout( function(){ location.href="home_ordini.html"; }, 1000 );

      }catch(err){
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>AGGIORNAMENTO DATI AGGIUNTIVI</h2></li>");
        $.mobile.loading( "hide" );
      }  

    },
    error: function (xhr, status) {
      console.log("Error " + status + ": "+ xhr);
      $.mobile.loading( "hide" );
    }
  });
  
}


//////////////////////////////////////////////////
// ORDINI STEP1 - RICERCA CLIENTE
//////////////////////////////////////////////////
$( document ).on( "pagecreate", "#ordiniCreazionePage", function() {
  
  //verifico se sto arrivando dalla selezione di una bozza
  //in questo caso salto il primo step
  var ordine = {};
  goto_step2 = false;
  if(localStorage.getItem('ordine') !== null){   
    ordine = JSON.parse(localStorage.getItem('ordine'));
    if(ordine.da_lista_bozze == '1') goto_step2 = true;
  }
  
  //procedo con il caricamento standard della pagina
  if(goto_step2 === false){
    
    //nascondo i contenuti degli altri step
    $('.step1').show();
    $('.step2').hide();
    $('.step3').hide();
    $('.step4').hide();
    
    
    //carico l'elenco completo dei clienti
    var clienti = JSON.parse(localStorage.getItem('clienti'));
    
    //imposto il titolo
    $('#titolo').html( 'Selezione Cliente');
  
    //ciclo l'elenco dei clienti
    search = "";
    $.each( clienti, function( id, cliente ){
      search += "<li>";
        search += "<a href=\"javascript:void(0);\" onClick=\"creaOrdine_AggiungiCliente('"+ cliente.codice_cliente +"','"+ btoa(cliente.ragione_sociale) +"','"+ cliente.codice_pagamento +"');\" >";
          search += cliente.ragione_sociale + " - " + cliente.codice_cliente;
        search += "</a>";
      search += "</li>";
    });
  
    $('#search_customer').html( search );
    $('#search_customer').listview( "refresh" );
    $('#search_customer').trigger( "updatelayout");
    
  
    //istanzio il filtro
    $( "#search_customer" ).on( "filterablebeforefilter", function ( e, data ) {
      var $ul = $( this ),
          $input = $( data.input ),
          value = $input.val(),
          html = "";
          $ul.html( "" );
          
      //effettuo la ricerca dopo aver inserito almeno 3 caratteri
      if ( (value && value.length >= 3) || value === "" ){
        
        $ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
        $ul.listview( "refresh" );
        
        //recupero le info dell'agente
        var clienti = JSON.parse(localStorage.getItem('clienti'));
  
        //ciclo l'elenco dei clienti
        html = "";
        $.each( clienti, function( id, cliente ){
          html += "<li>";
            html += "<a href=\"javascript:void(0);\" onClick=\"creaOrdine_AggiungiCliente('"+ cliente.codice_cliente +"','"+ btoa(cliente.ragione_sociale) +"','"+ cliente.codice_pagamento +"');\" >";
              html += cliente.ragione_sociale + " - " + cliente.codice_cliente;
            html += "</a>";
          html += "</li>";
        });
  
        $ul.html( html );
        $ul.listview( "refresh" );
        $ul.trigger( "updatelayout");
  
      }
      
    });    
    
  }else{
    
    //reimposto il flag per il reindirizzamento
    ordine.da_lista_bozze = '0';
    var ordine_json = JSON.stringify(ordine);
    localStorage.setItem('ordine', ordine_json);
    
    //vado allo step successivo
    ordiniCreazioneStep2();
    
  }
  
});

//creo l'ordine, aggiungo i dati del cliente e rimando allo step 2
function creaOrdine_AggiungiCliente(codice_cliente, ragione_sociale, codice_pagamento){
  
  //tengo in memoria un solo ordine, cancello eventuali ordini precedenti
  if(localStorage.getItem('ordine') !== null){
    localStorage.removeItem('ordine');
  }
  
  //recupero le info dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  //eseguo il decode della ragione sociale base64
  var ragione_sociale_decoded = atob(ragione_sociale);
  
  //creo l'array e lo converto in json
  var ordine = {
    'bozza_id': '',
    'bozza_creazione': '',
    'bozza_aggiornamento': '',
    'agente_codice': agente.codice,
    'agente_nome': agente.nome + " " + agente.cognome,
    'cliente_codice': codice_cliente,
    'cliente_ragionesociale': ragione_sociale_decoded,
    'cliente_codicepagamento': codice_pagamento
  };
  var ordine_json = JSON.stringify(ordine);
  
  //salvo il json nel local storage
  localStorage.setItem('ordine', ordine_json);
  
  //vado allo step 2
  ordiniCreazioneStep2();
  
}



//////////////////////////////////////////////////
// ORDINI STEP2 - RIGHE ORDINE
//////////////////////////////////////////////////
function ordiniCreazioneStep2(){
  
  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.step2').fadeIn(800);
  $('.step3').hide();
  $('.step4').hide();
  
  //se ho caricato i dati da una bozza impedisco il passaggio allo step precedente
  if(localStorage.getItem('ordine') !== null){   
    ordine = JSON.parse(localStorage.getItem('ordine'));
    if(ordine.bozza_id !== '') $('.step2 .back').hide();
  }
  
  //modifico title
  $('#titolo').html( 'Creazione Righe Ordine');
  
  //aggiungo codice e ragione sociale del cliente
  var ordine = JSON.parse(localStorage.getItem('ordine'));
  $("#sottotitolo").html(ordine.cliente_ragionesociale + ' - ' + ordine.cliente_codice);
  
  //funzione per creare le righe nella tabella
  for (i = 0; i < NUMERO_RIGHE_ORDINE; i++) { 
    
    creaRigheOrdine(i);
    
    //se ho caricato i dati da una bozza imposto la visualizzazione
    id_riga = i+1;
    if(ordine.bozza_id !== '' && typeof ordine.righe[id_riga] !== 'undefined' ){
      
      var riga = ordine.righe[id_riga];
      
      //compilo i campi della riga
      $('#codice_' + i).val( riga.codice );
      $('#descrizione_' + i).val( riga.descrizione );
      $('#taglia_' + i).val( riga.taglia );
      $('#colore_' + i).val( riga.colore );
      
      //campi relativi alle qta e alle scontistiche
      $("#qta_" + i).val( riga.qta );
      if(riga.omaggio=="1")  $("#omaggio_" + i).prop( "checked", true );
      $("#sconto_" + i).val( riga.sconto );
      
      //riformatto il prezzo
      prezzo = number_format( riga.prezzo, 2, '.', '');
      $('#prezzo_' + i).val(prezzo);
      
      //imposto i campi descrittivi (codice e descrizione) e nascondo i campi codice
      $('#codice_' + i).hide();
      $('#descrizione_' + i).hide();
      $('#view_codice_' + i).html( riga.codice );
      $('#view_descrizione_' + i).html( riga.descrizione );
      
      //modifico l'icona a inizio riga per consentire il reset della stessa
      $('#ricerca_riga_' + i).hide();
      $('#reset_riga_' + i).show();  
      
      //ricalcolo i totali di riga
      ricalcolaTotaliRiga(i);
      
    }
    
    //ricalcolo i totali ordine
    ricalcolaTotaliOrdine();
    
  }
  
  //definisco la dimensione delle colonne
  $('table#righe-ordine tr td').eq(0).css('width','1%');
  $('table#righe-ordine tr td').eq(1).css('width','2%');
  $('table#righe-ordine tr td').eq(2).css('width','10%');
  $('table#righe-ordine tr td').eq(3).css('width','36%');
  $('table#righe-ordine tr td').eq(4).css('width','10%');
  $('table#righe-ordine tr td').eq(5).css('width','10%');
  $('table#righe-ordine tr td').eq(6).css('width','3%');
  $('table#righe-ordine tr td').eq(7).css('width','12%');
  $('table#righe-ordine tr td').eq(8).css('width','15%');
  
}

function creaRigheOrdine(id_riga) {
  
  var numero_riga=id_riga+1;
  
  var riga = "<tr>" +
                "<td>" +
                  "<span class=\"numero_riga\" >" + numero_riga + ".</span>" +
                "</td>" +
                "<td>" +
                  "<a id=\"ricerca_riga_" + id_riga + "\" href=\"javascript:void(0);\" onClick=\"ricercaArticolo(" + id_riga + ");\" >" +
                    "<i class=\"zmdi zmdi-search-for zmdi-hc-2x\" ></i>" +
                  "</a>" +                  
                  "<a id=\"reset_riga_" + id_riga + "\" href=\"javascript:void(0);\" onClick=\"resetRigaArticolo(" + id_riga + ");\" style=\"display:none;\" >" +
                    "<i class=\"zmdi zmdi-close-circle-o zmdi-hc-2x\" ></i>" +
                  "</a>" +
                "</td>" + 
                "<td>" +
                  //campo input
                  "<input type=\"text\" id=\"codice_" + id_riga + "\" class=\"ricerca_articolo\" value=\"\" data-clear-btn=\"false\" >" +
                  //campo visualizzazione
                  "<span id=\"view_codice_" + id_riga + "\" ></span>" +
                "</td>" +
                "<td>" +
                  //campi input
                  "<input type=\"text\" id=\"descrizione_" + id_riga + "\" class=\"ricerca_articolo\" value=\"\" data-clear-btn=\"false\" >" +
                  //campi input nascosti
                  "<input type=\"hidden\" id=\"taglia_" + id_riga + "\" value=\"\" >" +
                  "<input type=\"hidden\" id=\"colore_" + id_riga + "\" value=\"\" >" +
                  "<input type=\"hidden\" id=\"min-qta_" + id_riga + "\" value=\"\" >" +
                  "<input type=\"hidden\" id=\"max-sconto_" + id_riga + "\" value=\"\" >" +
                  "<input type=\"hidden\" id=\"tipo-sconto_" + id_riga + "\" value=\"\" >" +
                  //campi visualizzazione
                  "<span id=\"view_descrizione_" + id_riga + "\" class=\"descrizione_articolo\" ></span>" +
                  "<span id=\"view_taglia_" + id_riga + "\" ></span>" +
                  "<span id=\"view_colore_" + id_riga + "\" ></span>" +
                "</td>" +
                "<td>" +
                  "<input type=\"text\" name=\"prezzo\" id=\"prezzo_" + id_riga + "\" value=\"\" style=\"text-align:right\" READONLY >" +
                "</td>" +
                "<td>" +
                  "<input type=\"number\" name=\"qta\" id=\"qta_" + id_riga + "\" value=\"\" style=\"text-align:right\" onChange=\"ricalcolaTotali(" + id_riga + ");\" onFocus=\"verificaArticoloSelezionato(" + id_riga + ");\" >" +
                "</td>" +
                "<td class=\"campo_omaggio\">" +
                  "<input type=\"checkbox\" id=\"omaggio_" + id_riga + "\" value=\"1\"  onChange=\"ricalcolaTotali(" + id_riga + ");\" >" +
                "</td>" +
                "<td class=\"campo_sconto\">" +
                  "<input type=\"number\" id=\"sconto_" + id_riga + "\" value=\"\" style=\"text-align:right\"  onChange=\"ricalcolaTotali(" + id_riga + ");\" >" +
                "</td>" +
                "<td>" +
                  "<input type=\"text\" name=\"totale\" id=\"totale_" + id_riga + "\" value=\"\" style=\"text-align:right\" READONLY >" +
                "</td>" +
              "</tr>";
  
  $('#righe-ordine tbody').append(riga);

}

//funzione attivata all'onfocus sul campo qta
//per verificare se l'articolo è già stato caricato o va effettuata la ricerca
function verificaArticoloSelezionato(id_riga){
  
  //se è stato inserito il codice ma non è stato ancora valorizzato il prezzo verifico se il campo descrizione è già stato valorizzato
  if(document.getElementById('codice_' + id_riga).value !== "" && document.getElementById('prezzo_' + id_riga).value === ""){
    ricercaArticolo(id_riga);
  }
  
}

//funzione per effettuare la ricerca dell'articolo
function ricercaArticolo(id_riga){
  
  //recupero codice e descrizione inseriti
  var codice_ricerca = document.getElementById('codice_' + id_riga).value;
  var descrizione_ricerca = document.getElementById('descrizione_' + id_riga).value;
  
  //effettuo la ricerca per codice e descrizione
  var articoli = JSON.parse(localStorage.getItem('articoli'));

  //ciclo l'elenco dei articoli
  var numero_risultati_ricerca = 0;
  var risultati_ricerca = [];
  $.each( articoli, function( codice_articolo, articolo ){
    var descrizione_articolo = articolo.descrizione;
    var confezione_articolo = articolo.confezione;
    
    //aggiungo un carattere fittizio davanti a codice articolo e descrizione
    codice_articolo_confronto = "#" + codice_articolo;
    descrizione_articolo_confronto = "#" + descrizione_articolo;
    
    //se è stato inserito il codice articolo effettuo la ricerca solo per codice (dall'inizio della stringa)
    if(codice_ricerca !== "" && codice_articolo_confronto.toLowerCase().indexOf( codice_ricerca.toLowerCase() ) === 1){
      
      risultati_ricerca.push(codice_articolo + "|" + descrizione_articolo + "|" + confezione_articolo);
      numero_risultati_ricerca++;
    
    }//altrimenti effettuo la ricerca per descrizione (all'interno della stringa)
    else if(codice_ricerca === "" && descrizione_ricerca !== "" && descrizione_articolo_confronto.toLowerCase().indexOf( descrizione_ricerca.toLowerCase() ) > 0){
      
      risultati_ricerca.push(codice_articolo + "|" + descrizione_articolo + "|" + confezione_articolo);
      numero_risultati_ricerca++;
      
    }
    
  });

  //se non ho trovato nessuna corrispondenza
  if(numero_risultati_ricerca === 0){
    $("#popupSegnalazioneContent").html('Nessun articolo trovato per i parametri di ricerca inseriti.');
    $("#popupSegnalazione").popup("open", "pop");
  }
  //altrimenti se ho un solo risultato predispongo i campi nel form
  else if(numero_risultati_ricerca === 1){
    
    $.each( risultati_ricerca, function( id, articolo ){
      var dati_articolo = articolo.split("|");
      inserisciRigaArticolo(id_riga, dati_articolo[0], '');
    });
    
  }
  //altrimenti apro il popup di selezione
  else{
    
    var list = "<ul id=\"search_item\" data-role=\"listview\" >";
    
    $.each( risultati_ricerca, function( id, articolo ){
      var dati_articolo = articolo.split("|");
      list += "<li>";
        list += "<a href=\"javascript:void(0);\" onClick=\"inserisciRigaArticolo(" + id_riga + ", '" + dati_articolo[0] + "', 'popup');\" >";
          
          descrizione_articolo = dati_articolo[1];
          if(dati_articolo[1].length>50){
            descrizione_articolo = dati_articolo[1].substring(1, 47) + "...";
          }        
          list += dati_articolo[0] + " | " + descrizione_articolo + " | " + dati_articolo[2];
          
        list += "</a>";
      list += "</li>";
    });
    
    list += "</ul>";

    $("#search_list").html(list);
    
    //apro il popup
    $("#popupRicercaArticolo").popup("open", "pop");
    
  }
  
}

//funzione per inserire l'articolo selezionato nella riga e predispore gli ulteriori campi
function inserisciRigaArticolo(id_riga, codice_articolo_selezionato, tipo){
  
  //chiudo il popup di ricerca articoli
  if(tipo === 'popup'){
    $("#popupRicercaArticolo").popup("close", "pop");
  }
  
  var articolo_selezionato = {};
  var articoli = JSON.parse(localStorage.getItem('articoli'));
  $.each( articoli, function( codice_articolo, articolo ){
    
    if(codice_articolo === codice_articolo_selezionato){
      
      //imposto l'articolo selezionato
      articolo_selezionato = articolo;
      
      //esco dal ciclo
      return false;
            
    }

  });  
  //salvo in console i dati dell'articolo
  console.log(articolo_selezionato);
  
  
  //compilo i campi della riga
  $('#codice_' + id_riga).val( articolo_selezionato.codice_articolo );
  $('#descrizione_' + id_riga).val( articolo_selezionato.descrizione );
  $('#taglia_' + id_riga).val('');
  $('#colore_' + id_riga).val('');
  
  //campi relativi alle scontistiche
  $('#min-qta_' + id_riga).val('');
  $('#max-sconto_' + id_riga).val('');
  $('#tipo-sconto_' + id_riga).val('');
  
  //riformatto il prezzo
  prezzo = number_format( articolo_selezionato.prezzo_listino, 2, '.', '');
  $('#prezzo_' + id_riga).val(prezzo);
  
  //imposto i campi descrittivi (codice e descrizione) e nascondo i campi codice
  $('#codice_' + id_riga).hide();
  $('#descrizione_' + id_riga).hide();
  $('#view_codice_' + id_riga).html( articolo_selezionato.codice_articolo );
  $('#view_descrizione_' + id_riga).html( articolo_selezionato.descrizione );
  
  //modifico l'icona a inizio riga per consentire il reset della stessa
  $('#ricerca_riga_' + id_riga).hide();
  $('#reset_riga_' + id_riga).show();  
  
  
  //richiamo il popup del controllo disponibilità
  popupDisponibilita(id_riga, articolo_selezionato);
  
}


//funzione per aprire il popup di visualizzazione della disponibilità dell'articolo
function popupDisponibilita(id_riga, articolo_selezionato){
      
  disponibile=articolo_selezionato.disponibile * 1;
  disponibile_da=articolo_selezionato.disponibile_da;
  
  //se l'articolo non è disponibile mostro il popup di segnalazione  
  if(disponibile != 1){
    
    var msg="";
    msg = "L'articolo momentaneamente non &egrave; disponibile a magazzino.";
		if(disponibile_da !== "") msg += "<br/>L'articolo sar&agrave; nuovamente disponibile dal <b>" + disponibile_da + "</b>.";
    
    //salvo l'id_riga ed il contenuto dell'articolo in un campo input nascosto
    $('#id_riga_disponibilita').val(id_riga);
    var articolo_json = JSON.stringify(articolo_selezionato);
    $('#articolo_json_disponibilita').val(articolo_json);
    
    //mostro il popup
    $("#popupDisponibilitaContent").html(msg);
    setTimeout( function(){ $( '#popupDisponibilita' ).popup("open", "pop"); }, 100 );
    
    
  }else{
    
    popupPromozioni(id_riga, articolo_selezionato);
     
  }
  
}


//funzione per aprire il popup di visualizzazione di eventuali promozioni
function popupPromozioni(id_riga, articolo_selezionato, tipo){
  
  //chiudo il popup di disponibilita
  if(tipo === 'popup'){
    $("#popupDisponibilita").popup("close", "pop");
  }
  
  //campi per il calcolo delle scontistiche
  box_promozioni = tipo_sconto = "";
  qta_min = 0;//imposto di default la qta minima articoli a 0
  sconto_max = articolo_selezionato.sconto_max * 1;			
  qta1 = articolo_selezionato.qta1 * 1;
  sconto_qta1 = articolo_selezionato.sconto_qta1 * 1;
  qta2 = articolo_selezionato.qta2 * 1;
  sconto_qta2 = articolo_selezionato.sconto_qta2 * 1;
  qta3 = articolo_selezionato.qta3 * 1;
  sconto_qta3 = articolo_selezionato.sconto_qta3 * 1;  

  //se per l'articolo è disponibile una promo mostro il popup di selezione
  if(qta1>0){
  
    var string_qtal = "Nessuno sconto presente";
    if(sconto_max !== 0)
      string_qtal = "Sconto Max " + sconto_max + " %";
      
    box_promozioni += "<li><a href=\"javascript:void(0);\" onClick=\"impostaPromoQta("+id_riga+", '', "+sconto_max+", 'promo_qta_libera');\" >Quantit&agrave; Libera - " + string_qtal + "</a></li>";
    box_promozioni += "<li><a href=\"javascript:void(0);\" onClick=\"impostaPromoQta("+id_riga+", "+qta1+", "+sconto_qta1+", 'promo_qta_1');\" >Promo " + qta1 + " PZ - Sconto Max " + sconto_qta1 + " %</a></li>";
    
    if(qta2>0){
      box_promozioni += "<li><a href=\"javascript:void(0);\" onClick=\"impostaPromoQta("+id_riga+", "+qta2+", "+sconto_qta2+", 'promo_qta_2');\" >Promo " + qta2 + " PZ - Sconto Max " + sconto_qta2 + " %</a></li>";
    }
    
    if(qta3>0){
      box_promozioni += "<li><a href=\"javascript:void(0);\" onClick=\"impostaPromoQta("+id_riga+", "+qta3+", "+sconto_qta3+", 'promo_qta_3');\" >Promo " + qta3 + " PZ - Sconto Max " + sconto_qta3 + " %</a></li>";
    }
    
    tipo_sconto = "PQ";//promo qta
    
  }else if(sconto_max !== 0){//sconto massimo impostato
    
    box_promozioni += "<li><a href=\"javascript:void(0);\" onClick=\"$( '#popupPromozioni' ).popup('close', 'pop');\" >Lo sconto massimo applicabile per l'articolo &egrave; " + sconto_max + " %</a></li>";    
    qta_min=0;
    tipo_sconto="PF";//promo fissa
    
  }else{//nessuna promo o sconto arriva per l'articolo
    
    qta_min = 0;
    sconto_max = 0;
    tipo_sconto = "PF";//promo fissa
    
  }
  
  //imposto i campi nascosti
  $('#min-qta_' + id_riga).val(qta_min);
  $('#max-sconto_' + id_riga).val(sconto_max);
  $('#tipo-sconto_' + id_riga).val(tipo_sconto);
  
  //verifico se mostrare il box promozioni o meno
  if(box_promozioni !== ""){
    
    //salvo il contenuto dell'articolo in un campo input nascosto
    var articolo_json = JSON.stringify(articolo_selezionato);
    $('#articolo_json_promozioni').val(articolo_json);
    
    //compongo la lista e mostro il popup
    var list = "<ul id=\"search_item\" data-role=\"listview\" >";
    list += box_promozioni;
    list += "</ul>";
    
    $("#popupPromozioniContent").html(list);
    setTimeout( function(){ $( '#popupPromozioni' ).popup("open", "pop"); }, 100 );
    
  }else{

    popupTaglieColori(id_riga, articolo_selezionato);
    
  }

}

//funzione per impostare i campi a seguito della selezione di una promo qta
function impostaPromoQta(id_riga, qta, sconto, tipo_promo){
  
  //imposto i campi per la gestione delle promozioni
  $('#qta_' + id_riga).val(qta);
  $('#min-qta_' + id_riga).val(qta);
  $('#max-sconto_' + id_riga).val(sconto);
  
  //rimuovo il check dall'omaggio
  $('#omaggio_' + id_riga).prop('checked', false); 
  
  if(tipo_promo == 'promo_qta_libera'){    
    $('#sconto_' + id_riga).val("");
  }else{
    $('#sconto_' + id_riga).val(sconto);
  }
  
  //effettuo il ricalcolo dei totali
  ricalcolaTotali(id_riga);
  
  //rimando al popupTaglieColori
  popupTaglieColori(id_riga, JSON.parse($('#articolo_json_promozioni').val()), 'popup');
  
}


//funzione per aprire il popup di selezione taglie e colori
function popupTaglieColori(id_riga, articolo_selezionato, tipo){
  
  //chiudo il popup delle promozioni
  if(tipo === 'popup'){
    $("#popupPromozioni").popup("close", "pop");
  }
  
  //recupero taglie e colori
  taglie=articolo_selezionato.taglie;
  colori=articolo_selezionato.colori;
  
  //se l'articolo è a taglia / colore mostro il popup di selezione
  var selezione_taglia_colore = "";
  if(taglie !== "" || colori !== ""){
    
    //resetto l'attuale select, recupero le taglie ed imposto il campo del form
    if(taglie !== ""){
      
      $('#taglia').empty();
      $('#taglia').append('<option value=""></option>');
      selezione_taglia_colore += "T";
      
      var elenco_taglie = taglie.split(";");
      $.each( elenco_taglie, function( id, taglia ){
        if(taglia !== ""){
          var dati_taglia = taglia.split(",");
          $('#taglia').append($('<option>', { 
            value: dati_taglia[0] + '|' + dati_taglia[1],
            text : dati_taglia[1] 
          }));
        }
      });
      
      $('#taglia').show();//mostro la select
      $("#taglia").val('');//imposto la selezione di default
    }else{
      $('#taglia').hide();
    }
    
    //recupero i colori ed imposto il campo del form
    if(colori !== ""){
                 
      $('#colore').empty();
      $('#colore').append('<option value=""></option>');
      selezione_taglia_colore += "C";
      
      var elenco_colori = colori.split(";");
      $.each( elenco_colori, function( id, colore ){
        if(colore !== ""){
          var dati_colore = colore.split(",");
          $('#colore').append($('<option>', { 
            value: dati_colore[0] + '|' + dati_colore[1],
            text : dati_colore[1] 
          }));
        }
      });
      
      $('#colore').show();
      $("#colore").val('');//imposto la selezione di default
    }else{
      $('#colore').hide();
    }
    
    //salvo nel campo nascosto del popup l'id della riga di riferimento ed il tipo di selezione T, C o TC
    $('#id_riga_caratteristiche').val(id_riga);
    $('#tipo_selezione_caratteristiche').val(selezione_taglia_colore);

    //apertura del popup
    $("span.select-popup").html('&nbsp;');
    setTimeout( function(){ $( '#popupTaglieColori' ).popup("open", "pop"); }, 100 );
    
  }
  
}


//funzione per impostare le caratteristiche selezionate di taglia e colore nella riga articolo
function impostaTagliaColore(){
  
  //recupero l'id della riga e le caratteristiche impostate
  var id_riga=$('#id_riga_caratteristiche').val();
  var tipo=$('#tipo_selezione_caratteristiche').val();
  
  //verifico le caratteristiche articolo da recuperare
  var caratteristica1 = "";
  var caratteristica2 = "";
  var lunghezza_stringa = (tipo.trim().length)*1;
  
  caratteristica1 = tipo.substring(0,1);
  if(lunghezza_stringa > 1) caratteristica2 = tipo.substring(1,2);

  //recupero la taglia
  if(caratteristica1 === 'T' || caratteristica2 === 'T'){
    var taglia_selezionata=$('#taglia').val();
    var dati_taglia=taglia_selezionata.split("|");
    
    $('#taglia_' + id_riga).val(dati_taglia[0]);
    $('#view_taglia_' + id_riga).html(' - <b>' + dati_taglia[1] + '</b>');
  }

  //recupero il colore
  if(caratteristica1 === 'C' || caratteristica2 === 'C'){
    var colore_selezionato=$('#colore').val();
    var dati_colore=colore_selezionato.split("|");
    
    $('#colore_' + id_riga).val(dati_colore[0]);
    $('#view_colore_' + id_riga).html(' - <b>' + dati_colore[1] + '</b>');
  }
  
  //chiudo il popup
  $("#popupTaglieColori").popup("close", "pop");
  
}


//funzione per resettare la riga articolo creata
function resetRigaArticolo(id_riga){
  
  //svuoto tutti i campi
  $('#codice_' + id_riga).val('');
  $('#descrizione_' + id_riga).val('');
  $('#taglia_' + id_riga).val('');
  $('#colore_' + id_riga).val('');
  $('#prezzo_' + id_riga).val('');
  $('#view_codice_' + id_riga).html('');
  $('#view_descrizione_' + id_riga).html('');
  $('#view_taglia_' + id_riga).html('');
  $('#view_colore_' + id_riga).html('');
  
  //reimposto la corretta visualizzazione di campi e icone
  $('#codice_' + id_riga).show();
  $('#descrizione_' + id_riga).show();
  $('#ricerca_riga_' + id_riga).show();
  $('#reset_riga_' + id_riga).hide();  
  
}


//funzione per ricalcolare i totali di riga e di ordine
function ricalcolaTotali(id_riga){
  
  //ricalcolo i totali di riga
  ricalcolaTotaliRiga(id_riga);
  
  //ricalcolo i totali ordine
  ricalcolaTotaliOrdine();
  
}


//funzione per ricalcolare i totali di riga
function ricalcolaTotaliRiga(id_riga){
  
  //recupero i dati necessari per la verifica ed il ricalcolo dei totali
  var prezzo = $('#prezzo_' + id_riga).val()*1;
  var qta = $('#qta_' + id_riga).val()*1;
  var sconto = $('#sconto_' + id_riga).val()*1;
  
  var max_sconto = $('#max-sconto_' + id_riga).val();
  var tipo_sconto = $('#tipo-sconto_' + id_riga).val();
  
  var omaggio = 0;
  if(document.getElementById('omaggio_' + id_riga).checked === true) omaggio = 1;
  
  //verifico la correttezza dei dati
  var alert_msg = "";
  if(tipo_sconto == 'PF'){
    
    if(sconto > max_sconto){
      //mostro l'alert di segnalazione
      if(max_sconto === 0) alert_msg = "Nessuna scontistica impostabile per l'articolo.";
      else alert_msg = "Lo sconto impostato supera il limite massimo imposto del " + sconto_max + "%.";     
      alert(alert_msg);
      //imposto il nuovo sconto
      $('#sconto_' + id_riga).val(sconto_max);
      sconto = sconto_max;
    }
    
  }
  
  
  ////verifico che la quantita sia >= della quantita minima
  ////alert(qta+"<"+qta_min);
  //if(qta<qta_min){
  //    alert('La quantit\u00E1 impostata \u00E8 inferiore al limite minimo di '+qta_min+' PZ.');
  //    document.getElementById('quantita').value=qta_min;
  //    check=false;
  //}
  //
  ////verifico che lo sconto sia <= dello sconto massimo
  //if(tipo_sconto=='PQ' && document.getElementById('check_qtal').checked=='false') {
  //    
  //    if(sconto>sconto_max){
  //        alert('Lo sconto impostato supera il limite massimo imposto del '+sconto_max+'%.');
  //        document.getElementById('sconto').value=sconto_max;
  //        check=false;
  //    }
  //    
  //}else{
  //    
  //    if(sconto>sconto_max && document.getElementById('omaggio').checked==false){
  //        alert('Lo sconto impostato supera il limite massimo imposto del '+sconto_max+'%.');
  //        document.getElementById('sconto').value=sconto_max;
  //        check=false;
  //    }
  //    
  //}
  
  
  //ricalcolo i totali
  var totale_riga = 0;
  if(omaggio === 1){
    totale_riga = 0;
    $('#sconto_' + id_riga).val("");
  }else{
    totale_riga = (prezzo * qta) - ((prezzo * qta) / 100 * sconto);
  }
  
  //riformatto i totali
  totale_riga = number_format(totale_riga, 2, '.', '');
  
  $('#totale_' + id_riga).val(totale_riga);
  
}

//funzione per ricalcolare i totali ordine
function ricalcolaTotaliOrdine(){
  
  //ciclo le righe per trovare la prima senza codice articolo
  totale_lordo = totale_netto = 0;
  righe_counter = 0;
  for (id = 0; id < NUMERO_RIGHE_ORDINE; id++) { 
    
    totale_riga_lordo = totale_riga_netto = 0;
    if( $('#codice_' + id).val() !== ""){
      
      prezzo = $('#prezzo_' + id).val();
      qta = $('#qta_' + id).val();
      //alert(prezzo + ' - ' + qta);
      
      totale_riga_lordo = prezzo * qta;
      totale_riga_netto = $('#totale_' + id).val() * 1;        
        
    }
    
    totale_lordo += totale_riga_lordo;    
    totale_netto += totale_riga_netto;
    
  }
  
  //riformatto i totali
  totale_lordo = number_format(totale_lordo, 2, '.', '');
  totale_netto = number_format(totale_netto, 2, '.', '');
  //alert(totale_lordo + ' - ' + totale_netto);
  
  //mostro a video i totali
  $('#totale_lordo').val(totale_lordo);
  $('#totale_netto').val(totale_netto);
  
} 

//funzione per ricalcolare il totale riga
function ricalcolaTotaleRiga(id_riga){

  var prezzo = ($('#prezzo_' + i).val())*1;
  var qta = ($('#qta_' + i).val())*1;
  var sconto = ($('#sconto_' + i).val())*1;
  
  var totale_riga = 0;
  totale_riga = (prezzo * qta) - ((prezzo * qta)/100)*sconto;

}

//funzione per verificare il contenuto dell'ordine prima dell'apertura del popup
function openPopupSalvataggioOrdine(){
  
  //verifico che sia stata inserita almeno una riga
  var check = false;
  for (id = 0; id < NUMERO_RIGHE_ORDINE; id++) { 
    
    if( $('#codice_' + id).val() !== "" && $('#qta_' + id).val() !== "" ){
      check = true;
      break;
    }

  }
  
  if(check === true){
    $('#popupSalvataggioOrdine').popup('open', 'pop');
  }else{
    $("#popupSegnalazioneContent").html('Inserire almeno una riga.');
    $("#popupSegnalazione").popup("open", "pop");
  }
  
  
}

//funzione per aggiungere le righe impostate all'ordine
function creaOrdine_AggiungiRighe(tipo){
  
  //chiudo il popup
  $("#popupSalvataggioOrdine").popup("close", "pop");
  
  //ciclo le righe per trovare la prima senza codice articolo
  var righe = {};
  var righe_counter = 0;
  for (i = 0; i < NUMERO_RIGHE_ORDINE; i++) { 
    
    if( $('#codice_' + i).val() !== ""){
      
      righe_counter++;
      
      var riga = {};
      riga.codice = $('#codice_' + i).val();
      riga.descrizione = $('#descrizione_' + i).val();
      riga.taglia = $('#taglia_' + i).val();
      riga.colore = $('#colore_' + i).val();
      riga.prezzo = $('#prezzo_' + i).val();
      riga.qta = $('#qta_' + i).val();
      
      riga.omaggio = 0;
      riga.sconto = ($('#sconto_' + i).val());       
      if(document.getElementById('omaggio_' + i).checked === true){
        riga.omaggio = 1;
        riga.sconto = 100;
      }
      
      riga.totale = $('#totale_' + i).val();
      
      righe[righe_counter] = riga;

    }
    
  }

  //recupero i dati dell'ordine salvati
  var ordine = JSON.parse(localStorage.getItem('ordine'));
  
  //aggiungo il numero di righe inserite
  ordine.numero_righe = righe_counter;
  
  //aggiungo i dati relativi alle righe ordine e lo risalvo
  ordine.righe = righe;
  
  //se il tipo è bozza
  if(tipo == "bozza"){
    
    //ciclo le bozze presenti
    var bozze = JSON.parse(localStorage.getItem('ordini_bozze'));
    var numero_bozze = 1;
    var id_bozza = 0;
    $.each( bozze, function( id, bozza ){
      
      if(ordine.bozza_id !== "" && ordine.bozza_id == bozza.bozza_id){
        id_bozza = id;
      }
      
      numero_bozze++;
    });
    
    data_aggiornamento = current_datetime();
    ordine.bozza_aggiornamento = '' + data_aggiornamento;//trasformo in stringa
    
    //verifico se ho trovato la bozza nell'elenco oppure se devo crearla
    if(id_bozza !== 0){
      bozze[id_bozza] = ordine;            
    }else{
      ordine.bozza_id = ordine.agente_codice + '_' + ordine.bozza_aggiornamento + '_' + btoa(ordine.cliente_ragionesociale) + '.json';
      ordine.bozza_creazione = ordine.bozza_aggiornamento;
      bozze[numero_bozze] = ordine;
    }
    var bozze_json = JSON.stringify(bozze);
    localStorage.setItem('ordini_bozze', bozze_json);
    
    //nascondo il tasto per tornare indietro
    $('.step2 .back').hide();
    
  }
  
  //salvo in console le righe
  console.log(ordine);
  
  //risalvo l'ordine in locale
  var ordine_json = JSON.stringify(ordine);
  localStorage.setItem('ordine', ordine_json);
  
  //se il tipo è ordine reindirizzo allo step3
  if(tipo == "ordine") ordiniCreazioneStep3();
  
}



//////////////////////////////////////////////////
// ORDINI STEP3 - COMPLETAMENTO ORDINE
//////////////////////////////////////////////////
function ordiniCreazioneStep3(){
  
  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.step2').hide();
  $('.step3').fadeIn(800);
  $('.step4').hide();
  
  //modifico titolo e sottotitolo
  $('#titolo').html( "Completa l'Ordine" );
  $("#sottotitolo").html( "" );
  
  
  //recupero i dati del cliente selezionato nell'ordine
  var ordine = JSON.parse(localStorage.getItem('ordine'));
  var cliente_ordine = ordine.cliente_codice;
  var clienti = JSON.parse(localStorage.getItem('clienti'));
  
  var ragione_sociale = "";
  var indirizzo = "";
  var cap = "";
  var provincia = "";
  var modalita_pagamento_cliente = "";
  $.each( clienti, function( id, dati_cliente ){
    if(dati_cliente.codice_cliente === cliente_ordine){
      ragione_sociale = dati_cliente.ragione_sociale;
      indirizzo = dati_cliente.indirizzo;
      citta = dati_cliente.citta;
      cap = dati_cliente.cap;
      provincia = dati_cliente.provincia;
      modalita_pagamento_cliente = dati_cliente.codice_pagamento;
      
      return false;
    }
  });
  
  
   
  //imposto le opzioni di selezione della modalità di pagamento
  var modalita_pagamento = JSON.parse(localStorage.getItem('pagamento'));
  $.each( modalita_pagamento, function( codice, descrizione ){
    if(codice !== ""){
      $('#modalita_pagamento').append($('<option>', { 
        value: codice,
        text : codice + ' - ' + descrizione
      }));
    }
  });
  //imposto la modalità di default per il cliente
  $('#modalita_pagamento').val(modalita_pagamento_cliente).change();

  
  
  //imposto le date di consegna richieste
  //se entro le 15.00 allora imposto il giorno successivo
  //se oltre le 15.00 allora due giorni successivi
  var oggi = new Date();
  var data_consegna = new Date();
  var ora = oggi.getHours();

  data_consegna.setDate(oggi.getDate() + 1);
  if(ora>=15){
    data_consegna.setDate(oggi.getDate() + 2);
  }

  //recupero giorno, mese e anno della data consegna
  gg = pad(data_consegna.getDate(), 2);
  mm = pad(data_consegna.getMonth()+1, 2);//gennaio = 0
  aaaa = data_consegna.getFullYear();
  
  $('#data_consegna').val(aaaa + '-' + mm + '-' + gg);
  
  
  //visualizzo l'indirizzo di fatturazione
  var indirizzo_fatturazione = "";
  indirizzo_fatturazione+= ragione_sociale +"<br/>";
  indirizzo_fatturazione+= indirizzo +"<br/>";
  indirizzo_fatturazione+= cap + " " + citta + " (" + provincia + ")"; 
  $('#indirizzo_fatturazione').html(indirizzo_fatturazione);
  
};

//funzione per completare l'ordine con le informazioni aggiuntive
function creaOrdine_PagamentoSpedizione(){
  
  //aggiungo le info aggiuntive all'ordine
  var ordine = JSON.parse(localStorage.getItem('ordine'));  
  
  ordine.modalita_pagamento = $('#modalita_pagamento').val();
  ordine.data_consegna = $('#data_consegna').val();
  ordine.spedizione_indirizzo = $('#spedizione_indirizzo').val();
  ordine.spedizione_cap = $('#spedizione_cap').val();
  ordine.spedizione_citta = $('#spedizione_citta').val();
  ordine.spedizione_provincia = $('#spedizione_provincia').val();
  ordine.note = $('#note').val();
  
  //mostro in console l'ordine aggiornato
  console.log(ordine);
  
  //risalvo l'ordine in locale
  var ordine_json = JSON.stringify(ordine);
  localStorage.setItem('ordine', ordine_json);

  //reindirizzo allo step4
  ordiniCreazioneStep4();
  
}



//////////////////////////////////////////////////
// ORDINI STEP4 - ESPORTAZIONE
//////////////////////////////////////////////////
function ordiniCreazioneStep4(){
  
  //nascondo i contenuti degli altri step
  $('.step1').hide();
  $('.step2').hide();
  $('.step3').hide();
  $('.step4').fadeIn(800);
  
  //modifico titolo e sottotitolo
  $('#titolo').html( "Esportazione Ordini" );
  $("#sottotitolo").html( "" );

}
  

//funzione di esportazione ordini
function esportazioneOrdine(){

  //resetto il msg response
  $.mobile.loading( "show", {
    text: "esportazione ordini in corso, attendere",
    textVisible: true,
    theme: "",
    html: ""
  });
  
  //resetto il messaggio iniziale alla lista di esportazione
  $('.response_msg').html("");
  
  //recupero i dati dell'agente
  var agente = JSON.parse(localStorage.getItem('agente'));
  
  //recupero l'ordine corrente
  var json_ordine = localStorage.getItem('ordine');
  var ordine = JSON.parse(json_ordine);

  var codice_agente = agente.codice;
  var token = agente.token;
  
  console.log('IMPORTAZIONE ORDINE CORRENTE >> ' + json_ordine);
  
  //invio via ajax l'ordine corrente
  $.ajax({
    url: API_PATH + 'ordini.php',
    type: "POST",   
    crossDomain: true,
    data: {
      codice_agente: codice_agente,
      token: token,
      action: 'inserisci_ordine',
      json_ordine: json_ordine
    },
    success: function(response){
      
      var response_array = response.split("|");
      var status = response_array[0];
      var description = response_array[1];
      
      if(status=='OK'){
        
        //nascondo il bottone di esportazione e il loader
        $('#export_form_submit').hide();
        $.mobile.loading( "hide" );
        
        //mostro il messaggio di importazione
        $('.response_msg').append("<li><img src=\"img/button_confirm.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ORDINE ESPORTATO CORRETTAMENTE</h2></li>");       
        
        //verifico se l'ordine era stato generato da una bozza
        if(ordine.bozza_id !== ""){
          
          //rimuovo la bozza dalla quale è stato generato l'ordine       
          var bozze = JSON.parse(localStorage.getItem('ordini_bozze'));
          console.log(bozze);
          
          var bozze_new = {};
          var bozze_counter = 1;
          $.each( bozze, function( id, bozza ){
              
              if(ordine.bozza_id != bozza.bozza_id){               
                  bozze_new[bozze_counter] = bozza;
                  bozze_counter++;
              }
              
          });
          
          console.log(bozze_new);
          var bozze_json = JSON.stringify(bozze_new);
          localStorage.setItem('ordini_bozze', bozze_json);
          
        }
        
        //rimuovo l'ordine
        localStorage.removeItem('ordine');
        
      }else if(status=='KO'){
        
        $('.response_msg').append("<li><img src=\"img/button_close.png\" class=\"ui-thumbnail ui-thumbnail-circular\" /><h2>ERRORE ESPORTAZIONE ORDINE</h2><br><p>" + description + "</p></li>");
        $.mobile.loading( "hide" );
      
      }else{
        
        alert(response);
        
      }
  
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      
      //se non è presente una connessione allora procedo con il salvataggio in locale dell'ordine
      alert("Connessione assente, effettuare l'esportazione con una connessione attiva");
      
      //verifico se è già presente nel localstorage il file contenente gli ordini da esportare
      //if(localStorage.getItem('ordini_da_esportare') !== null){
      //  alert('creazione archivio ordine');
      //}
      
      //aggiungo l'ordine corrente all'archivio ordini da esportare
      
      
      //cancello l'ordine corrente
      
      
    }
  });  
  
};



//////////////////////////////////////////////////
// ORDINI STORICO
//////////////////////////////////////////////////
$( document ).on( "pagecreate", "#ordiniStorico", function() {
  
  //recupero i dati relativi allo storico ordini
  var ordini = JSON.parse(localStorage.getItem('ordini_storico'));
  //console.log(ordini);
  
  //nascondo i campi del dettaglio
  $('#reloadListaOrdini').hide();
  $('#numero_ordine').hide();
  $('#dettaglio_ordine').hide();
  
  //li mostro a video
  var list = "<ul id=\"search_item\" data-role=\"listview\" >";
  
  $.each( ordini, function( id, ordine ){
    list += "<li>";
      list += "<a href=\"javascript:void(0);\" onClick=\"dettaglioOrdine('"+ id +"');\" >";
        
        var ragione_sociale = ordine.cliente_descrizione;
        var data_ordine = date_format(ordine.data_ordine.substring(0, 10), 'yyyy-mm-dd', 'dd/mm/yyyy');
        var numero_ordine = ordine.numero_ordine;
        var importo = number_format(ordine.importo,2,',','.');
        
        //flexbox grid
        list += "<div class=\"row\">";
          
          if(ragione_sociale === null) ragione_sociale = "NUOVO CLIENTE";
          list += "<div class=\"col-xs-6\">" + ragione_sociale + "</div>";
          list += "<div class=\"col-xs-2\">" + numero_ordine + "</div>";
          list += "<div class=\"col-xs-2\">" + data_ordine + "</div>";        
          list += "<div class=\"col-xs-2\" align=right >" + importo + " &euro;</div>";
        
        list += "</div>";
        
      list += "</a>";
    list += "</li>";
  });
  
  list += "</ul>";
  
  //mostro il titolo
  $('#titolo').html('Ultimi Ordini Inseriti');

  //mostro il contenuto
  $('#elenco_ordini').html( list );
  $('#elenco_ordini').show();
  
  
});

function dettaglioOrdine(id_ordine){
  
  //nascondo la lista ordini
  $('#elenco_ordini').hide();
  
  //recupero i dati relativi all'ordine
  var ordini = JSON.parse(localStorage.getItem('ordini_storico'));
  var ordine_selezionato = [];
  $.each( ordini, function( id, ordine ){
    if(id == id_ordine){
      ordine_selezionato = ordine;
      return false;//esco dal ciclo
    }
  });
  
  //mostro il titolo
  $('#titolo').html('Dettaglio Ordine');
  $('#numero_ordine').html('<br/>Ordine N. ' + ordine_selezionato.numero_ordine);
  $('#numero_ordine').show();
  $('#reloadListaOrdini').show();
  
  //contenuto ordine (testata)
  var ord = "";
  ord+= "<div class=\"row\"><div class=\"col-xs-4\"><b>DATA ORDINE:</b></div><div class=\"col-xs-8\">" + date_format(ordine_selezionato.data_ordine.substring(0, 10), 'yyyy-mm-dd', 'dd/mm/yyyy') + "</div></div>";
  ord+= "<div class=\"row\"><div class=\"col-xs-4\"><b>DATA CONSEGNA:</b></div><div class=\"col-xs-8\">" + date_format(ordine_selezionato.data_consegna, 'yyyy-mm-dd', 'dd/mm/yyyy') + "</div></div>";
  ord+= "<div class=\"row\"><div class=\"col-xs-4\"><b>IMPORTO:</b></div><div class=\"col-xs-8\">" + number_format(ordine_selezionato.importo, 2, ',','.') + "&euro;</div></div>";
  
  tipo_pagamento_array = ordine_selezionato.tipo_pagamento.split("|");
  ord+= "<div class=\"row\"><div class=\"col-xs-4\"><b>PAGAMENTO:</b></div><div class=\"col-xs-8\">" + tipo_pagamento_array[1] + "</div></div>";
  ord+= "<div class=\"row\"><div class=\"col-xs-4\"><b>NOTE:</b></div><div class=\"col-xs-8\">" + ordine_selezionato.note + "</div></div>";
  
  ord+= "<br/>";
  
  //contenuto ordine (righe)
  ord+= "<div class=\"row tbl_head\">";
    ord+= "<div class=\"col-xs-2\">CODICE</div>";
    ord+= "<div class=\"col-xs-3\">DESCRIZIONE</div>";
    ord+= "<div class=\"col-xs-2\">TGL/COL</div>";
    ord+= "<div class=\"col-xs-1\">PRZ</div>";
    ord+= "<div class=\"col-xs-1\">QT&Agrave;</div>";
    ord+= "<div class=\"col-xs-1\">SC %</div>";
    ord+= "<div class=\"col-xs-2\">TOTALE</div>";
  ord+= "</div>";
    
  $.each( ordine_selezionato.righe, function( id_riga, riga ){

    ord+= "<div class=\"row tbl_body\">";
      ord+= "<div class=\"col-xs-2\">" + riga.codice_articolo + "</div>";
      ord+= "<div class=\"col-xs-3\">" + riga.descrizione_articolo + "</div>";
      
      var tgl_col = "";
      if(riga.taglia !== "") tgl_col+= riga.taglia;
      if((riga.taglia !== "" && riga.colore !== "") || (riga.taglia === "" && riga.colore === "")) tgl_col+= " - ";
      if(riga.colore !== "") tgl_col+= riga.colore;
      
      ord+= "<div class=\"col-xs-2\" align=center>" + tgl_col + "</div>";
      ord+= "<div class=\"col-xs-1\" align=right>" + number_format(riga.prezzo_listino,2,',','.') + "</div>";
      ord+= "<div class=\"col-xs-1\" align=right>" + riga.quantita + "</div>";
      ord+= "<div class=\"col-xs-1\" align=right>" + riga.sconto + "</div>";
      ord+= "<div class=\"col-xs-2\" align=right>" + number_format(riga.valore_netto,2,',','.') + "</div>";
    ord+= "</div>";
    
  });
  
  ord+= "<div class=\"row tbl_foot\">";
    ord+= "<div class=\"col-xs-10\" align=right >TOTALE</div>";
    ord+= "<div class=\"col-xs-2\" align=right >" + number_format(ordine_selezionato.importo, 2, ',','.') + "</div>";
  ord+= "</div>";
  
  
  //mostro il dettalgio ordine
  $('#dettaglio_ordine').html( ord );
  $('#dettaglio_ordine').fadeIn(800);
  
  
}

//////////////////////////////////////////////////
// ORDINI BOZZE
//////////////////////////////////////////////////
$( document ).on( "pagecreate", "#ordiniBozze", function() {
  
  //recupero i dati relativi alle bozze ordini
  var bozze = JSON.parse(localStorage.getItem('ordini_bozze'));
  //console.log(bozze);
  
  //li mostro a video
  var list = "<ul id=\"search_item\" data-role=\"listview\" >";
  
  $.each( bozze, function( id, bozza ){    
    list += "<li>";
      list += "<a href=\"javascript:void(0);\" onClick=\"selezionaBozza('"+ id +"');\" >";
        
        var ragione_sociale = bozza.cliente_ragionesociale;
        var data_bozza = date_format(bozza.bozza_aggiornamento.substring(0, 8), 'yyyymmdd', 'dd/mm/yyyy');
        var ora_bozza = time_format(bozza.bozza_aggiornamento.substring(8, 14), 'hhiiss', 'hh:ii:ss');
        var numero_righe = bozza.numero_righe;
        
        //flexbox grid
        list += "<div class=\"row\">";
          
          if(ragione_sociale === null) ragione_sociale = "NUOVO CLIENTE";
          list += "<div class=\"col-xs-6\">" + ragione_sociale + "</div>";
          list += "<div class=\"col-xs-2\">" + data_bozza + "</div>";
          list += "<div class=\"col-xs-2\">" + ora_bozza + "</div>";        
          list += "<div class=\"col-xs-2\">" + numero_righe + " righe</div>";
        
        list += "</div>";
        
      list += "</a>";
    list += "</li>";
  });
  
  list += "</ul>";
  
  //mostro il titolo
  $('#titolo').html('Elenco Bozze Ordine');

  //mostro il contenuto
  $('#elenco_bozze').html( list );
  $('#elenco_bozze').show();
  
  
});

function selezionaBozza(id_bozza){
  
  //recupero i dati relativi alla bozza
  var bozze = JSON.parse(localStorage.getItem('ordini_bozze'));
  var bozza_selezionata = [];
  $.each( bozze, function( id, bozza ){
    if(id == id_bozza){
      bozza_selezionata = bozza;
      return false;//esco dal ciclo
    }
  });
  
  //imposto i campi del form ordine con i dati della bozza
  
  //tengo in memoria un solo ordine, cancello eventuali ordini precedenti
  if(localStorage.getItem('ordine') !== null){
    localStorage.removeItem('ordine');
  }
  
  //creo l'array ordine
  var ordine = {};
  ordine.da_lista_bozze = '1';
  ordine.bozza_id = bozza_selezionata.bozza_id;
  ordine.bozza_creazione = bozza_selezionata.bozza_creazione;
  ordine.bozza_aggiornamento = bozza_selezionata.bozza_aggiornamento;
  ordine.agente_codice = bozza_selezionata.agente_codice;
  ordine.agente_nome = bozza_selezionata.agente_nome;
  ordine.numero_righe = bozza_selezionata.numero_righe;
  ordine.cliente_codice = bozza_selezionata.cliente_codice;
  ordine.cliente_ragionesociale = bozza_selezionata.cliente_ragionesociale;
  ordine.cliente_codicepagamento = bozza_selezionata.cliente_codicepagamento;
  ordine.righe = bozza_selezionata.righe;
  console.log(ordine);
  
  //salvo l'ordine in locale
  var ordine_json = JSON.stringify(ordine);
  localStorage.setItem('ordine', ordine_json);
  
  //vado alla pagina ordini
  location.href="ordini_creazione.html";

}
