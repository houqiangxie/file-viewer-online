import {useRef, useState} from "react";
import {FileOutlined, FolderOutlined, HighlightOutlined} from "@ant-design/icons";
import FilesList from "./filesList/index.jsx";
import FileViewer from "./fileViewer/index.jsx";

function App() {
    const filesListRef = useRef();
    const fileReaderRef = useRef();
    // 左侧文件栏选中文件
    const [currentSelectFileInLeftList, setCurrentSelectFileInLeftList] = useState({key: "", file: null});
    const [hightLightBtnDisplay, sethightLightBtnDisplay] = useState(false);

    // 打开选择文件夹弹窗
    const selectDir = () => {
        filesListRef.current.selectDir();
    }
    // 打开选择文件弹窗
    const selectFile = async () => {
        const fileHandel = await showOpenFilePicker();
        // 因为 API 允许多选（本系统不允许），所以提取第一个
        const currentFile = await fileHandel[0].getFile();
        fileReaderRef.current.readFile(currentFile,`${currentFile.name}_${currentFile.size}_${currentFile.lastModified}`)
        setCurrentSelectFileInLeftList({key: "", file: null})
    }
    const showHightLightStyleSelector = () => {
        fileReaderRef.current.setHightLightSelectorDisplay(true)
    }

    return <>
        <div className="tools">
            <div className="selectDirBtn" onClick={ selectDir }><FolderOutlined/> 文件夹</div>
            <div className="selectFileBtn" onClick={ selectFile }><FileOutlined/> 文件</div>
            {
                hightLightBtnDisplay &&
                <div className="hightlightBtn" onClick={ showHightLightStyleSelector }><HighlightOutlined/> 高亮样式</div>
            }
        </div>
        <div className="contextView">
            <FilesList
                currentSelectFileInLeftList={ currentSelectFileInLeftList }
                ref={ filesListRef }
                setCurrentSelectFileInLeftList={ setCurrentSelectFileInLeftList }
            />
            <FileViewer
                currentSelectFileInLeftList={ currentSelectFileInLeftList }
                setCurrentSelectFileInLeftList={ setCurrentSelectFileInLeftList }
                ref={ fileReaderRef }
                sethightLightBtnDisplay={ sethightLightBtnDisplay }
            />
        </div>
    </>;
}

export default App;
