import {forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {message, Modal, Spin} from "antd";
import SyntaxHighlighter from "react-syntax-highlighter";
import * as allHightLightStyles from "react-syntax-highlighter/dist/esm/styles/hljs";
import {LightAsync} from 'react-syntax-highlighter';
import classNames from "classnames";
import {CloseCircleOutlined} from "@ant-design/icons";

// 定义不能通过 text 展示的二进制文件类型
const binaryFileTypes = [
    'application/octet-stream',
    'application/zip',
    'application/pdf',
    'application/vnd.android.package-archive',
    'audio/',
    'video/',
    'image/'
    // 根据需要添加更多类型
];

// 未匹配上highlight的类型特殊手动映射
const notNormalTypeMap = new Map([
    ["js", "javascript"],
    ["html", "htmlbars"]
])

// 可选的文字尺寸范围
const fontSizeRange = [12, 25];



const FileViewer = memo(forwardRef((props, ref) => {
    const {currentSelectFileInLeftList, sethightLightBtnDisplay, setCurrentSelectFileInLeftList} = props;

    // 打开弹窗前高亮样式
    const previousHightlightStyle = useRef({name: "a11yDark",style:allHightLightStyles.a11yDark});
    const fileReader = useRef(new FileReader());
    const fontSizeTipDelayerTime = useRef(null);
    const [imgReaderSrc, setImgReaderSrc] = useState(null);
    const [currentFileText, setCurrentFileText] = useState(null);
    const [fileType, setFileType] = useState(null);
    const [fileStyle, setFileStyle] = useState(previousHightlightStyle.current);
    const [hightLightSelectorDisplay, setHightLightSelectorDisplay] = useState(false);
    const [fontSize, setFontSize] = useState(16);
    const fileShowTextRef = useRef(null);
    const [fontSizeTipDisplay, setFontSizeTipDisplay] = useState(false);
    const [openedFilePool, setOpenedFilePool] = useState([]);
    const [selectedOpenedFile, setSelectedOpenedFile] = useState(null);
    const [fileLoading, setFileLoading] = useState(false);


    useMemo(() => {
        fileReader.current.addEventListener("load", () => {
            setCurrentFileText(fileReader.current.result)
            setFileLoading(false);
        })
    }, [])

    useEffect(() => {
        if (currentSelectFileInLeftList.file) {
            readFile(currentSelectFileInLeftList.file, currentSelectFileInLeftList.key)
        }
    }, [currentSelectFileInLeftList]);


    const normalFileType = (file) => {
        const fileSuffix = file.name.split('.').pop();
        let heightLightMapType = LightAsync.supportedLanguages.find(item => item === fileSuffix);
        // 未匹配上需要判断是否能够手动映射
        if (!heightLightMapType) {
            heightLightMapType = notNormalTypeMap.get(fileSuffix) ?? ""
        }
        return heightLightMapType;
    }

    useEffect(() => {
        const fileShowTextEle = fileShowTextRef.current;
        if (!fileShowTextEle) return;

        const handleWheel = (event) => {
            // 是否同时按下了唱跳 rap 篮球（ctrl）键
            if (event.ctrlKey) {
                // 阻止浏览器默认缩放
                event.preventDefault();
                setFontSizeTipShow();
                if (event.deltaY < 0) { // 向上滚动
                    setFontSize(size => {
                        if (size + 1 > fontSizeRange[1]) return size
                        return size + 1
                    });
                } else { // 向下滚动
                    setFontSize(size => {
                        if (size - 1 < fontSizeRange[0]) return size
                        return size - 1
                    });
                }
            }
        };

        fileShowTextEle.addEventListener('wheel', handleWheel, {passive: false});

        return () => {
            fileShowTextEle.removeEventListener('wheel', handleWheel, {passive: false});
        };
    }, [fileShowTextRef]);

    useImperativeHandle(ref, () => ({
        readFile,
        setHightLightSelectorDisplay
    }))

    const setFontSizeTipShow = () => {
        if (fontSizeTipDisplay) {
            return
        }
        setFontSizeTipDisplay(true)
        clearTimeout(fontSizeTipDelayerTime.current)
        fontSizeTipDelayerTime.current = setTimeout(() => {
            setFontSizeTipDisplay(false)
        }, 3000)
    }

    const readFile = (file, key) => {
        const fileType = file.type;
        const isBinary = binaryFileTypes.some(type => fileType && fileType.startsWith(type));
        setFileLoading(true);
        // 处理能够正常转换为 TXT 的文件
        if (!isBinary) {
            addFileToFilePool(file, key);
            fileReader.current.readAsText(file);
            setFileType(normalFileType(file));
            sethightLightBtnDisplay(true);
            if (imgReaderSrc) {
                setImgReaderSrc(null);
            }
        } else if (fileType && fileType.startsWith('image/')) {
            addFileToFilePool(file, key);
            // 处理图片文件
            const imageUrl = URL.createObjectURL(file);
            setImgReaderSrc(imageUrl)
            setFileLoading(false);
            sethightLightBtnDisplay(false);
            if (currentFileText) {
                setCurrentFileText(null)
            }
        } else {
            message.error("不支持的文件类型！")
        }
    }
    const addFileToFilePool = (file, key) => {
        setSelectedOpenedFile(key);
        if (openedFilePool.findIndex(item => item.key === key) !== -1) return;
        const currentFile = {file, key, displayName: file.name, sameNum: 0};
        // 处理相同文字名字
        const sameFileNameFileIndex = openedFilePool.findIndex(item => item.name === name);
        if (sameFileNameFileIndex !== -1) {
            currentFile.sameNum++;
            currentFile.displayName += "-" + currentFile.sameNum;
            openedFilePool[sameFileNameFileIndex].sameNum++;
        }
        setOpenedFilePool(value => [...value, currentFile])
    }
    const fileShowTextStyle = () => ({
        display: imgReaderSrc || !currentFileText ? "none" : "block",
        fontSize: fontSize + "px"
    })
    const hightLightSelectorConfirm = () => {
        previousHightlightStyle.current = fileStyle;
        setHightLightSelectorDisplay(false);
    }
    const hightLightSelectorCancel = () => {
        setFileStyle(previousHightlightStyle.current)
        setHightLightSelectorDisplay(false);
    }
    const hightLightStyleItemClick = (item) => {
        setFileStyle({name: item,style:allHightLightStyles[item]})
    }
    const openedFileItemClick = (fileInfo) => {
        if (selectedOpenedFile === fileInfo.key) return;
        setSelectedOpenedFile(fileInfo.key);
        const file = fileInfo.file;
        // key 与 name 不相同说明在左侧文件夹栏中存在
        if (fileInfo.key !== file.name) {
            setCurrentSelectFileInLeftList({file, key: fileInfo.key})
        } else {
            readFile(file, `${ file.name }_${ file.size }_${ file.lastModified }`);
        }
    }
    const outOpenedFile = (event, fileInfo) => {
        event.stopPropagation();
        const index = openedFilePool.findIndex(item => item.key === fileInfo.key);
        setOpenedFilePool(value => value.toSpliced(index, 1))
        if (index === 0  && openedFilePool.length === 1) {
            setImgReaderSrc(null)
            setCurrentFileText(null)
            setCurrentSelectFileInLeftList({file: null,key: ""});
            sethightLightBtnDisplay(false);
            return
        }
        if (selectedOpenedFile === fileInfo.key) {
            openedFileItemClick(openedFilePool[index - 1])
        }
    }
    return (
        <>
            <div className="fileShowArea">
                {
                    openedFilePool.length > 0 &&
                    <div className="openedFilePoolWrapper">
                        {
                            openedFilePool.map(item =>
                                <div key={ item.key }
                                     className={ classNames("openedFileItem", {
                                         selectFileItem: selectedOpenedFile === item.key
                                     }) }
                                     onClick={ () => openedFileItemClick(item) }
                                >
                                    { item.displayName }
                                    <span className="outOpenedFileBtn"
                                          onClick={ (event) => outOpenedFile(event, item) }
                                    ><CloseCircleOutlined/></span>
                                </div>
                            )
                        }
                    </div>
                }
                <div className="fileAreaTips">
                    {
                        (!currentFileText && !imgReaderSrc) &&
                        <span className="fileShowAreaTip">左上角打开文件或文件夹</span>
                    }
                    {
                        fileLoading && <Spin size="large"/>
                    }
                </div>
                <div className="fileContent">
                    { imgReaderSrc && <img src={ imgReaderSrc } alt="图片加载错误"/> }
                    <div className="fileShowText" ref={ fileShowTextRef } style={ fileShowTextStyle() }>
                        {
                            imgReaderSrc ? <> </> :
                                <SyntaxHighlighter innerHTML={ true } language={ fileType } style={ fileStyle.style }>
                                    { currentFileText }
                                </SyntaxHighlighter>
                        }
                    </div>
                </div>
                <span
                    className={ classNames(
                        "fontSizeTip",
                        fontSizeTipDisplay ? "showFontSizeTip" : "hiddenFontSizeTip"
                    ) }>
                    当前文字大小：{ fontSize } px ({ fontSizeRange[0] } ~ { fontSizeRange[1] })
                </span>
                <div className="hightLightSelector">
                    <Modal
                        title="高亮样式"
                        open={ hightLightSelectorDisplay }
                        okText="应用"
                        cancelText="取消"
                        onOk={ hightLightSelectorConfirm }
                        onCancel={ hightLightSelectorCancel }
                        width="20vw"
                        mask={ false }
                        getContainer={ document.querySelector(".fileShowArea") }
                    >
                        {
                            Object.keys(allHightLightStyles).map(item =>
                                <div className={ classNames("hightLightStyleItem", {
                                    item_select: fileStyle.name === item
                                }) }
                                     key={ item }
                                     onClick={ () => hightLightStyleItemClick(item) }
                                >
                                    { item }
                                </div>
                            )
                        }
                    </Modal>
                </div>
            </div>
        </>
    );
}));

export default FileViewer;
