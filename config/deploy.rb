set :application,  "nb_aquatic_bioweb_map"
set :user,         "colin"
set :use_sudo,     false

# torquebox settings
set :jboss_home,   "/opt/torquebox/torquebox-current/jboss"
set :jboss_config, :default
set :deploy_to,    "/var/www/apps/#{application}"

# svn settings
set :scm,          :subversion
set :repository,   "http://subversion.assembla.com/svn/#{application}/trunk"

# roles
role :web,         "cri-linux.nbwaters.unb.ca"
role :app,         "cri-linux.nbwaters.unb.ca"
role :db,          "cri-linux.nbwaters.unb.ca", :primary => true
