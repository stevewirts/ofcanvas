'use strict';

var files = {
    js: [
        'gruntfile.js',
        'src/**/*.js',
        'examples/**/*.js',
        'test/**/*.js'
    ],

    jshint: [
        'gruntfile.js',
        'examples/**/*.js',
        'src/**/*.js',
        'test/**/*.js'
    ],

    scss: [
        'examples/**/*.{scss,sass}',
        'src/**/*.{scss,sass}',
        'test/**/*.{scss,sass}'
    ],

    html: [
        'examples/**/*.html',
    ],

    images: [
        'examples/**/*.{png,jpg,jpeg,gif}',
        'src/**/*.{png,jpg,jpeg,gif}',
        'test/**/*.{png,jpg,jpeg,gif}'
    ],

};

module.exports = function(grunt) {

    //load all npm tasks automagically
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        paths: {
            build: 'build'
        },

        watch: {
            js: {
                files: files.js,
                tasks: ['mochaTest', 'jsbeautifier', 'jshint', 'browserify'],
                options: {
                    livereload: true
                }
            },
            styles: {
                files: files.scss,
                tasks: ['sass:server', 'autoprefixer', 'cssmin']
            },
            gruntfile: {
                files: ['Gruntfile.js'],
                tasks: []
            },
            images: {
                files: files.images,
                tasks: ['imagemin']
            },
            html: {
                files: files.html,
                tasks: ['validation', 'newer:prettify']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: ['build/**/*.*', 'examples/dev/**/*.*']
            }

        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '<%= paths.build %>/*',
                        '!<%= paths.build %>/.git*'
                    ]
                }]
            }
        },

        jshint: {
            files: files.jshint,
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        concurrent: {
            server: [
                'sass'
            ]
        },

        sass: {
            server: {
                files: [{
                    expand: true,
                    cwd: 'src/styles/',
                    src: ['**/*.scss', '**/*.sass'],
                    dest: 'build/styles',
                    ext: '.css'
                }]
            }
        },

        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'build/styles/',
                    src: '{,*/}*.css',
                    dest: 'build/styles/'
                }]
            }
        },

        browserify: {
            dev: {
                src: [
                    'src/scripts/**/*.js'
                ],
                dest: 'build/scripts/ofcanvas.js'
            },
            options: {
                browserifyOptions: {
                    debug: true
                },
                transform: ['debowerify']
            }

        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/img',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: 'build/img'
                }]
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/*.js']
            }
        },

        jsbeautifier: {
            files: files.js,
            options: {
                js: {
                    braceStyle: 'collapse',
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: ' ',
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },

        prettify: {
            options: {
                'indent': 4,
                'indent_char': ' ',
                'indent_scripts': 'normal',
                'wrap_line_length': 0,
                'brace_style': 'collapse',
                'preserve_newlines': true,
                'max_preserve_newlines': 1,
                'unformatted': [
                    'a',
                    'code',
                    'pre',
                    'span'
                ]
            },
            rootViews: {
                expand: true,
                cwd: 'examples/dev/',
                ext: '.html',
                src: ['*.html'],
                dest: 'examples/dev/'
            }
        },

        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: '0.0.0.0',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        'build',
                        'examples/dev'
                    ]
                }
            }
        },
        validation: {
            options: {
                reset: grunt.option('reset') || false,
                stoponerror: true,
            },
            files: {
                src: files.html
            }
        },
        copy: {
            deploy: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'build/img',
                    dest: 'deploy/img',
                    src: [
                        '*.{ico,png}'
                    ]
                }, {
                    expand: true,
                    dot: true,
                    cwd: 'build/scripts',
                    dest: 'deploy/scripts',
                    src: [
                        '*.js'
                    ]
                }, {
                    expand: true,
                    dot: true,
                    cwd: 'build/styles',
                    dest: 'deploy/styles',
                    src: [
                        '*.css'
                    ]
                }, {
                    expand: true,
                    dot: true,
                    cwd: 'examples/deploy',
                    dest: 'deploy',
                    src: [
                        'index.html'
                    ]
                }]
            }
        }
        //----------------------------------
    });

    grunt.registerTask('test', ['jshint', 'mochaTest']);
    grunt.registerTask('default', [
        'jshint',
        'mochaTest',
        'jsbeautifier'
    ]);
    grunt.registerTask('build', [
        'clean',
        'browserify',
        'imagemin',
        'sass',
        'cssmin',
        'copy:deploy'
    ]);

    grunt.registerTask('serve', function() {
        return grunt.task.run([
            'clean',
            'browserify',
            'imagemin',
            'sass',
            'connect:livereload',
            'mochaTest',
            'watch'
        ]);
    });
};
