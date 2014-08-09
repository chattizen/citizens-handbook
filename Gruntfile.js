var fs          =   require('fs');
var sourceJS    =   [];
var jsFiles     =   fs.readdirSync('./static/js');
var jsIgnore    =   ['mustache.js', 'topojson.js'];
var i           =   jsFiles.length;

while(i--) {
    if(jsFiles[i].indexOf('.js') > -1 && jsFiles[i].indexOf('.min') === -1 && jsIgnore.indexOf(jsFiles[i]) === -1) {
        sourceJS.push('static/js/' + jsFiles[i]);
    }
}

sourceJS.push('Gruntfile.js');

module.exports  =   function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                files: {
                    'static/css/screen.css': 'static/sass/screen.scss',
                    'static/css/find-your-rep.css': 'static/sass/find-your-rep.scss'
                }
            },
            options: {
                loadPath: [
                    'bower_components/bourbon/dist',
                    'bower_components/css-smart-grid/sass'
                ],
                sourcemap: true,
                style: 'compressed'
            }
        },
        jshint: {
            files: sourceJS,
            jshintrc: '.jshintrc'
        },
        uglify: {
            options: {
                sourceMap: true
            },
            dist: {
                files: {
                    'static/js/core.min.js': ['bower_components/topojson/topojson.js', 'static/js/core.js'],
                    'static/js/ocd-divisions.min.js': ['static/js/ocd-divisions.js'],
                    'static/js/find-your-rep.min.js': ['static/js/mustache.js', 'static/js/ocd-divisions.js', 'static/js/find-your-rep.js'],
                    'static/js/calendar.min.js': ['static/js/mustache.js', 'static/js/calendar.js']
                }
            }
        },
        'json-minify': {
            build: {
                files: 'boundary-files/*.json'
            }
        },
        copy: {
            css: {
                files: [
                    {expand: true, src: ['static/css/*'], dest: '_site/', filter: 'isFile'}
                ]
            },
            images: {
                files: [
                    {expand: true, src: ['static/img/*'], dest: '_site/'}
                ]
            }
        },
        watch: {
            css: {
                files: 'static/sass/*.scss',
                tasks: ['sass', 'copy:css']
            },
            js: {
                files: sourceJS,
                tasks: ['newer:jshint', 'newer:uglify']
            },
            html: {
                files: [
                            '**/*.html',
                            '**/*.md',
                            '**/*.markdown',
                            '**/*.txt',
                            '!_site/**/*.html',
                            '!**/node_modules/**',
                            '!**/bower_components/**'
                        ],
                tasks: ['jekyll']
            },
            json: {
                files: ['boundary-files/*.json'],
                tasks: ['json-minify']
            },
            images: {
                files: ['static/img/**'],
                tasks: ['copy:images']
            }
        },
        connect: {
            server: {
                options: {
                    livereload: true,
                    base: '_site/',
                    port: 4000
                }
            }
        },
        jekyll: {
            options: {
                src: '<%= app %>'
            },
            dist: {
                options: {
                    config: '_config.yml'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-json-minify');
    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', [
        'jekyll',
        'connect:server',
        'watch'
    ]);
    grunt.registerTask('build', [
        'sass',
        'jshint',
        'uglify',
        'json-minify',
        'jekyll'
    ]);
};
