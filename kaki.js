dbalbums = new Meteor.Collection("dbalbums");

Meteor.methods({
		   saveAlbum: function(calb) {
		       if (this.is_simulation) {
			   return '';
		       }
		       
		       console.log('saving..', calb.album);
		       var already = dbalbums.findOne({key: calb.key});
		       if (!already) {
			   console.log('saving new song');
			   dbalbums.insert(calb);   
		       }
		       else {
			   console.log('updating song with', already._id, calb);
			   dbalbums.update({_id: already._id}, calb);
		       }

		       return dbalbums.findOne({key: calb.key});;
		   }
	       });


if (Meteor.is_client) {
    window.marks = [];
    Meteor.subscribe("hooky", function() {
			 var theone = dbalbums.findOne({key: window.getkey()});
			 if (!theone) {
			     window.getsong(window.artist, window.song);	
			 }
		     });

    window.getLyrics = function(artist, song, next) {
	$.getJSON('http://apitutapi.appspot.com/lylo?url=http://www.lyricsmania.com/' +
		  window.clearics(song) +
		  '_lyrics_' + window.clearics(artist) +
		  '.html&callback=?', function(a){
		  }).done(next);
    };

    window.fetchFromPipe = function(artist, song) {
	var tracks = [{
			  artist: {
			      name: artist
			  },
			  name: song}];

	var vidreadiez = [];
	$.each(tracks, function(i, trk) {

		   var vidready = $.Deferred();
		   vidreadiez.push(vidready);

		   var song = trk.artist.name + ' - ' + trk.name;
		   var req = $.getJSON('https://gdata.youtube.com/feeds/api/videos?q=' + song + '&orderby=relevance&max-results=1&v=2&alt=json&callback=?', function(e) {

					   if (!e.feed.entry || e.feed.entry.length === 0) {
					       console.log('empty. resolving')
					       vidready.resolve();
					       return;
					   }

					   var id = e.feed.entry[0].id.$t.split(':').reverse()[0];

					   var res = JSON.stringify({
									id: id,
									who_shared: 'takashirgb',
									fromindie: true,
									player: 'youtube_player',
									viewCount: e.feed.entry[0].yt$statistics.viewCount,
									favoriteCount: e.feed.entry[0].yt$statistics.favoriteCount,
									ucount: e.feed.entry[0].yt$statistics.viewCount + e.feed.entry[0].yt$statistics.favoriteCount * 100
								    });

					   console.log('good. resolving')
					   vidready.resolve(res);
				       });

		   $.when(req).fail(function() {
					console.log('failed. resolving')
					vidready.resolve()
				    });

		   setTimeout(

		       function() {
			   if (req.state() !== 'resolved') {
			       console.log('timeout. resolving')
			       vidready.resolve();
			   }
		       }, 5000);
	       });
	return vidreadiez;
    };


    window.clean = function(s) {
	return s.toLowerCase().replace(/the|and/gim,'').replace(/part/gim,'pt')
	    .replace(/[^a-zA-Z0-9]/gim,'').replace('around', 'round').trim(' ');

    };

    window.clearics = function(s) {
	return s.toLowerCase().replace(/\s/gim, '_').replace(/[^a-zA-Z0-9\s_]/gim, '').trim(' ');

    };


    window.getkey = function(){
	return window.clean(artist) + '_' + window.clean(song);
    };

    window.getsong = function(artist, song){
	getLyrics(window.artist, window.song, function(lyrics) {
		      $.when.apply($, fetchFromPipe(window.artist, window.song)).done(function(res) {
												    var tube = 'http://www.youtube.com/watch?v=' + JSON.parse(res).id; 


												    Meteor.call('saveAlbum', {key: window.getkey(), 
															      album: window.album,
															      artist: window.artist,
															      song: window.song,
															      lyrics: $(lyrics).text(),
															      tube: tube},

														function(e, curs) {		
														    console.log('saved', arguments);
														});
											  
										      });
		  });
    };

    window.doit = function(){
	window.mode = 'doit';
    };

    window.edit = function(){
	window.mode = 'edit';
    };

    //backbone
    var AppRouter = Backbone.Router.extend({
					       
					       routes: {
						   ":what/:artist/:album/:song":
						   "main"},
					       main: function(what, artist, album, song) {
						   if (window[what]) {
						       window.artist = decodeURIComponent(artist);
						       window.album = decodeURIComponent(album);
						       window.song = decodeURIComponent(song);
						       window[what](artist, album, song);   
						   }
					       } 

					   });

    window.app_router = new AppRouter();

    Backbone.history.start({pushState: true});

    window.renderpop = function(){
	window.renderpop = $.noop();
	window.popcorn = Popcorn.youtube("#video", alb.tube);

    };
    window.pop = $.Deferred();

    Template.lyrics.lyrics = function () {
	var xxx = dbalbums.findOne({key: window.getkey()});
	return xxx.lyrics;
    };

    Template.video.video = function () {
	var xxx = dbalbums.findOne({key: window.getkey()});
	setTimeout(function(){
		       window.popcorn = Popcorn.youtube("#video", xxx.tube);
		       window.pop.resolve();
		   },0);
    };

   Template.marks.marks = function () {
       var xxx = dbalbums.findOne({key: window.getkey()});
       setTimeout(function(){
		      pop.done(function(){
				   $.each(xxx.marks, function(i, mrk) {
					      window.popcorn = popcorn.subtitle(mrk);
					  });
			       });
		  },0);
       return xxx.marks;
    };

    Template.main.mode = function () {
	return window.mode;
    };

    Template.main.song = function () {
	var xxx = dbalbums.find({key: window.getkey()});
	return xxx;
    };

    window.lastplace = 0;
    window.lasttime = 0;
    Template.marks.events = {
	'click .alert button': function(){
	    
	}
    };
    Template.main.events = {
	'click .lyrics': function(){
            var thisplace = $('.lyrics')[0].selectionStart;
            var thistime = window.popcorn.currentTime();
            var subs = $('.lyrics').text().substring(window.lastplace, thisplace);
            var mark = {
                start: Math.max(0, window.lasttime - 1),
                end: Math.max(0, thistime - 1),
                text: '...' + subs
            };
            window.marks.push(mark);
            window.popcorn = popcorn.subtitle($.extend(mark, {
							   display: "inline",
							   language: "en"
						       }));

            window.lastplace = thisplace;
            window.lasttime = thistime;
	},

	'click #save' : function () {
	    var theone = dbalbums.findOne({key: window.getkey()});
	    theone.marks = window.marks;
	    Meteor.call('saveAlbum', theone,
			function(e, curs) {		
			    console.log('saved', arguments);
			});
	    
	},

	'click #reset' : function () {
	    var theone = dbalbums.findOne({key: window.getkey()});
	    theone.marks = [];
	    Meteor.call('saveAlbum', theone,
			function(e, curs) {		
			    console.log('saved', arguments);
			    window.popcorn = Popcorn.youtube("#video", alb.tube);
			});
	}

    };
}

if (Meteor.is_server) {
    Meteor.startup(function () {
		       Meteor.publish("hooky", function () {
					  return dbalbums.find({});
				      });

		       // code to run on server at startup
		   });
}