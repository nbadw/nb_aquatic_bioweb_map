#require 'rubygems'
#require 'arc_server_soap'
#require 'rest_proxy'
#require 'cgns_search'
#require 'print_map_service'
#require 'logger'
#
#begin
#  require "vendor/dependencies/lib/dependencies"
#rescue LoadError
#  require "dependencies"
#end
#
##use Rack::CommonLogger, Logger.new('/some/file/somewhere.log')
#
#map "/legends" do
#  use Rack::CommonLogger
#  run ArcServerSoap.new
#end
#
#map "/info" do
#  use Rack::CommonLogger
#  run RestProxy.new
#end
#
#map "/places" do
#  use Rack::CommonLogger
#  run CgnsSearch.new
#end
#
#map "/export" do
#  use Rack::CommonLogger
#  run PrintMapService.new
#end

#map "/test" do
#  app = lambda { |env| [200, { 'Content-Type' => 'text/html' }, 'Hello From NB Waters Map'] }
#  run app
#end