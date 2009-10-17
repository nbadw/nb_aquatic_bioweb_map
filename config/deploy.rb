set :application,  "nb_aquatic_bioweb_map"
set :user,         "colin"
set :use_sudo,     false
set :deploy_to,    "/home/colin/deploy/#{application}"

# svn settings
set :scm,          :subversion
set :repository,   "http://subversion.assembla.com/svn/#{application}/trunk"

# roles
role :web,         "cri-linux.nbwaters.unb.ca"
role :app,         "cri-linux.nbwaters.unb.ca"
role :db,          "cri-linux.nbwaters.unb.ca", :primary => true
