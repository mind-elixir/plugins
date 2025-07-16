<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node TEXT="FreeMind测试" ID="root" COLOR="#000000" BACKGROUND_COLOR="#ffff99">
    <font NAME="SansSerif" SIZE="20" BOLD="true"/>
    <edge COLOR="#808080" STYLE="bezier" WIDTH="thin"/>
    
    <node TEXT="第一个分支" ID="branch1" POSITION="right" COLOR="#0033ff">
      <font NAME="SansSerif" SIZE="18"/>
      <edge COLOR="#0033ff" STYLE="linear" WIDTH="1"/>
      
      <node TEXT="子节点1" ID="child1" COLOR="#00b439">
        <font NAME="SansSerif" SIZE="16"/>
        <richcontent TYPE="NOTE">
          <html>
            <head></head>
            <body>
              <p>这是一个<b>重要</b>的注释</p>
              <ul>
                <li>项目1</li>
                <li>项目2</li>
              </ul>
            </body>
          </html>
        </richcontent>
      </node>

      <node ID="richtext1" COLOR="#00b439">
        <richcontent TYPE="NODE">
          <html>
            <head></head>
            <body>
              <p>这是<em>富文本</em>节点标题</p>
            </body>
          </html>
        </richcontent>
        <font NAME="SansSerif" SIZE="16"/>
      </node>
      
      <node TEXT="子节点2" ID="child2" COLOR="#00b439" LINK="https://www.example.com">
        <font NAME="SansSerif" SIZE="16" ITALIC="true"/>
        <icon BUILTIN="idea"/>
      </node>
    </node>
    
    <node TEXT="第二个分支" ID="branch2" POSITION="left" COLOR="#ff6600">
      <font NAME="SansSerif" SIZE="18"/>
      <cloud COLOR="#f0f0f0"/>
      
      <node TEXT="折叠的节点" ID="folded" FOLDED="true" COLOR="#996600">
        <node TEXT="隐藏的子节点" ID="hidden" COLOR="#cc9900"/>
      </node>
      
      <node TEXT="带样式的节点" ID="styled" BACKGROUND_COLOR="#ccffcc">
        <font NAME="Arial" SIZE="14" BOLD="true"/>
        <edge COLOR="#00ff00" STYLE="sharp-bezier" WIDTH="2"/>
      </node>
    </node>
    
    <arrowlink DESTINATION="child2" COLOR="#ff0000" ENDARROW="Default"/>
  </node>
</map>
