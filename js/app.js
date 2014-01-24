;(function ($, window, document, undefined) {
	"use strict";

	// Foundation JavaScript
	// Documentation can be found at: http://foundation.zurb.com/docs
	$(document).foundation();

	/************* #1 *************/

	function appCacheStatus(){
	    var appCache = window.applicationCache;

		switch (appCache.status) {
			case appCache.UNCACHED:
		    	return 'AppCache: UNCACHED';
		    	break;
		  	case appCache.IDLE:
		    	return 'AppCache: IDLE';
		    	break;
		  	case appCache.CHECKING:
			    return 'AppCache: CHECKING...';
			    break;
		  	case appCache.DOWNLOADING:
			    return 'AppCache: DOWNLOADING...';
			    break;
		  	case appCache.UPDATEREADY:
		    	return 'AppCache: UPDATEREADY';
		    	break;
		  	case appCache.OBSOLETE:
			    return 'AppCache: OBSOLETE';
		    	break;
		  default:
		    	return 'AppCache: UNKNOWN STATE';
		    	break;
		};
	}

	/************* #2 *************/

	function validEmail(email) {
		var email_pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return email_pattern.test(email);
	}

	/************* #3 *************/

	function updateSendToAllLink(addresses) {
		var $stal = $("#send_to_all").attr("href", "");
		var href = "mailto:";
		for (var key in addresses){
			href += addresses[key].email + ",";
		}
		$stal.attr("href", href);
	}

	/************* #4 *************/

	function showAddresses(addresses) {

		var $tbody = $("#addresses tbody").html('');
		var html = "";

		for (var key in addresses){
			html += "<tr>";
				html += "<td>"+addresses[key].name+"</td>";
				html += "<td><a href=\"mailto:"+addresses[key].email+"\">"+addresses[key].email+"</a></td>";
				html += "<td><ul class=\"button-group radius\">";
					html += "<li><a href=\"#\" class=\"button tiny alert address_delete\" data-key=\""+key+"\">Usuń</button></li>";
					html += "<li><a href=\"#\" class=\"button tiny secondary address_edit\" data-key=\""+key+"\">Edytuj</button></li>";
					html += "<li><a href=\"mailto:"+addresses[key].email+"\" class=\"button tiny\">Wyślij</button></li>";
				html += "</ul></td>";
			html += "</tr>";
		}

		$tbody.append($(html));

	}

	/************* #5 *************/

	function addAddress(e) {

		e.preventDefault();

		var $name 	= $("#new-name");
		var $email 	= $("#new-email");

		var name 	= $name.val();
		var email 	= $email.val();

		if (!validEmail($email.val())) {
			$('#email_error').foundation('reveal', 'open');
			return;
		}

		var address = {
			name: 	name,
			email: 	email
		};

		$name.val('');
		$email.val('');

		var db 			= e.data.db;
		var transaction = db.transaction(["addresses"], "readwrite");
		var store 		= transaction.objectStore("addresses");
		var request 	= store.add(address);

		request.onerror = function(e) {
	        console.log("IndexedDB: Error " + e.target.error.name);
	    }
	 
	    request.onsuccess = function(e) {
	        console.log("IndexedDB: Adress added successfully ("+name+": "+email+")");
	        transaction.oncomplete = function(e) {
	        	getAddresses(db, [showAddresses, updateSendToAllLink]);    
	        }    
	    }

	}

	/************* #6 *************/

	function getAddresses(db, callbacks) {

		var transaction = db.transaction(["addresses"], "readonly");
		var store 		= transaction.objectStore("addresses");

		var result = [];

		store.openCursor().onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				result[cursor.key] = {name: cursor.value.name, email: cursor.value.email};
				cursor.continue();
			} else {
				transaction.oncomplete = function(e) {
					for (var index in callbacks)
						callbacks[index](result);
				}
			}
		}	

	}

	/************* #7 *************/

	function deleteAddress(e) {

		e.preventDefault();

		var key 		= $(this).data("key");
		var db 			= e.data.db;
		var transaction = db.transaction(["addresses"], "readwrite");
		var request 	= transaction.objectStore("addresses").delete(key);

		request.onsuccess = function(e) {
			transaction.oncomplete = function(e) {
				getAddresses(db, [showAddresses, updateSendToAllLink]);
			}
		}

	}

	/************* #8 *************/

	function editAddress(e) {

		e.preventDefault();

		var key 		= $(this).data("key");
		var db 			= e.data.db;
		var transaction = db.transaction(["addresses"], "readonly");
		var request		= transaction.objectStore("addresses").get(key);

		request.onsuccess = function(e){

			var result 			= e.target.result;

			var $name 			= $("#new-name");
			var $email 			= $("#new-email");
			var $add_address 	= $("#add_address");
			var $edit_buttons	= $("#edit_buttons");

			$name.val(result.name);
			$email.val(result.email);
			$add_address.hide();
			$edit_buttons.show();

			$("#cancel_edit_address").off("click.edit").on("click.edit", function(e){
				
				e.preventDefault();
				$name.val('');
				$email.val('');
				$edit_buttons.hide();
				$add_address.show();
				getAddresses(db, [showAddresses, updateSendToAllLink]);
				$("#edit_address").off("click.edit");

			});

			$("#edit_address").off("click.edit").on("click.edit", function(e){

				e.preventDefault();
				
				if (!validEmail($email.val())) {
					$('#email_error').foundation('reveal', 'open');
					return;
				}
				
				result.name 	= $name.val();
				result.email 	= $email.val();			

				var transaction = db.transaction(["addresses"], "readwrite");
				var request		= transaction.objectStore("addresses").put(result);

				request.onsuccess = function(e) {
					transaction.oncomplete = function(e) {
						$("#cancel_edit_address").click();
					}
				}

			});
		}
		
	}

	console.log(appCacheStatus());

	/************* #9 *************/

	window.applicationCache.addEventListener('updateready', function(e) {
		if (confirm('Dostępna jest nowa wersja strony. Załadować stronę ponownie?')) {
			window.location.reload();
		}
	}, false);

	/************* #10 *************/

	if (Modernizr.indexeddb) {
	    var open_db = window.indexedDB.open("mailing-list", 1);

	    open_db.onupgradeneeded = function(e) {
            console.log("IndexedDB: Database Upgrading...");
            var db = e.target.result;

            if (!db.objectStoreNames.contains("addresses")) {
                db.createObjectStore("addresses", {keyPath: "id", autoIncrement:true});
            }

            console.log("IndexedDB: Database Upgreaded");
        }
 
        open_db.onsuccess = function(e) {
        	console.log("IndexedDB: Database opened correctly");
            var db = e.target.result;

            $('#add_address').on("click", {db:db}, addAddress);
            $('#addresses').delegate(".address_delete", "click", {db:db}, deleteAddress);
            $('#addresses').delegate(".address_edit", "click", {db:db}, editAddress);
            getAddresses(db, [showAddresses, updateSendToAllLink]);
        }
 
        open_db.onerror = function(e) {
            console.error("IndexedDB: Open error occurred!");
            console.dir(e);
        }

	} else {
	    console.error("IndexedDB: IndexedDB is not supported in your browser!");
	}

}(jQuery, this, this.document));