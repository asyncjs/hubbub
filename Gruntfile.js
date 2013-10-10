module.exports = function(grunt) {
  grunt.initConfig({
      pkg : grunt.file.readJSON('package.json'),

      jshint: {
        files: ['Gruntfile.js', '<%= pkg.name %>.js'],
      },
      uglify: {
        options: {
          report: 'gzip', // Report minified size
          banner: '/*  <%= pkg.name %> v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd") %>) */\n\n'
        },
        build: {
          src: '<%= pkg.name %>.js',
          dest: 'build/<%= pkg.name %>.min.js',
          options: {
              sourceMap: 'build/<%= pkg.name %>.min.map',
              sourceMappingURL: '<%= pkg.name %>.min.map',
              preserveComments: 'some'
          }
        }
      },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint']);
};