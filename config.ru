require 'rubygems'
require 'logger'
require 'rack/urlmap'
require 'cgns_search'
require 'arcgis_server_rest_proxy'
require 'map_server_legend_info'

map "/info" do
  run ArcgisServerRestProxy.new
end

map "/places" do
  run CgnsSearch.new
end

map "/legends" do
  run MapServerLegendInfo.new
end
#
#map "/export" do
#  use Rack::CommonLogger
#  run PrintMapService.new
#end
