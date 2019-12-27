using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.IO;
using VisioForge.Controls.UI.WinForms;
using VisioForge.Types;

namespace AGView
{
    public partial class MainWindow : Form
    {
        private readonly List<PIPInfo> _pipInfos;
        private readonly ImageList _imageList;

        private readonly int _thumbWidth = 256;
        private readonly int _thumbHeight = 144;

        private int _lastZOrder = 8;

        public MainWindow()
        {
            InitializeComponent();

            _pipInfos = new List<PIPInfo>();
            _imageList = new ImageList();
            _imageList.ImageSize = new Size(_thumbWidth, _thumbHeight);
            _imageList.ColorDepth = ColorDepth.Depth32Bit;

            lvFiles.SmallImageList = _imageList;
            lvFiles.LargeImageList = _imageList;
        }

        private void btSelectFile_Click(object sender, EventArgs e)
        {
            if (openFileDialog1.ShowDialog() == DialogResult.OK)
            {
                edFilenameOrURL.Text = openFileDialog1.FileName;
            }
        }

        public Image GetThumbnail(string video, string thumbnail)
        {
            Console.WriteLine(video);
            Console.WriteLine(thumbnail);
            if (!File.Exists(thumbnail))
            {
                var cmd = "C:\\ffmpeg\\ffmpeg.exe  -itsoffset -1  -i " + '"' + video + '"' + " -vcodec mjpeg -vframes 1 -an -f rawvideo -s " + _thumbWidth.ToString() + "x" + _thumbHeight.ToString() + " " + '"' + thumbnail + '"';

                var startInfo = new ProcessStartInfo
                {
                    WindowStyle = ProcessWindowStyle.Hidden,
                    FileName = "cmd.exe",
                    Arguments = "/C " + cmd
                };

                var process = new Process
                {
                    StartInfo = startInfo
                };

                process.Start();
                process.WaitForExit(5000);
            }
            return Image.FromFile(thumbnail);
        }


        private void btStart_Click(object sender, EventArgs e)
        {
            MediaPlayer1.Debug_Mode = false;
            MediaPlayer1.Info_UseLibMediaInfo = true;

            MediaPlayer1.Video_Renderer.Zoom_Ratio = 0;
            MediaPlayer1.Video_Renderer.Zoom_ShiftX = 0;
            MediaPlayer1.Video_Renderer.Zoom_ShiftY = 0;

            MediaPlayer1.Video_Renderer.Video_Renderer = VFVideoRenderer.VMR9;
            MediaPlayer1.Source_Mode = VFMediaPlayerSource.LAV;

            MediaPlayer1.Play();

            MediaPlayer1.PIP_Sources_SetSourcePosition(0, _pipInfos[0].Rect, 1.0f);
            
            timer1.Start();
        }

        private void MediaPlayer1_OnError(object sender, ErrorsEventArgs e)
        {
            MessageBox.Show(e.ToString() + ": " + e.Message, "Fatal Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        private void btStop_Click(object sender, EventArgs e)
        {
            timer1.Stop();
            
            MediaPlayer1.Stop();

            _pipInfos.Clear();
            MediaPlayer1.PIP_Sources_Clear();
            lvFiles.Items.Clear();
        }

        private void btResume_Click(object sender, EventArgs e)
        {
            MediaPlayer1.Resume();
        }

        private void btPause_Click(object sender, EventArgs e)
        {
            MediaPlayer1.Pause();
        }

        private void Form1_Shown(object sender, EventArgs e)
        {
        }

        private void lbSourceFiles_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (lvFiles.SelectedIndices[0] >= 0)
            {
                var pip = _pipInfos[lvFiles.SelectedIndices[0]];
                tbStreamTransparency.Value = (int)(pip.Alpha * 100);
            }
        }

        private void btUpdateRect_Click(object sender, EventArgs e)
        {
            int index = lvFiles.SelectedIndices[0];
            if (index >= 0)
            {
                int left = Convert.ToInt32(0);
                int top = Convert.ToInt32(0);
                int width = Convert.ToInt32(0);
                int height = Convert.ToInt32(0);
                _pipInfos[index].Rect = new Rectangle(left, top, width, height);

                _pipInfos[index].ZOrder = Convert.ToInt32(5); // ToDo
                _pipInfos[index].Alpha = tbStreamTransparency.Value / 100.0f;

                if (left == 0 && top == 0 && width == 0 && height == 0)
                {
                    lvFiles.Items[lvFiles.SelectedIndices[0]].Text = $@"{_pipInfos[index].Filename} (entire screen)";
                }
                else
                {
                    lvFiles.Items[lvFiles.SelectedIndices[0]].Text = $@"{_pipInfos[index].Filename} ({left}.{top}px, width: {width}px, height: {height}px)";
                }

                MediaPlayer1.PIP_Sources_SetSourcePosition(index, _pipInfos[index].Rect, tbStreamTransparency.Value / 100.0f);
                MediaPlayer1.PIP_Sources_SetSourceOrder(index, _pipInfos[index].ZOrder);
            }
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            
        }

        private void tbStreamTransparency_Scroll(object sender, EventArgs e)
        {
            lbStreamTransparency.Text = tbStreamTransparency.Value.ToString();
        }

        private void MediaPlayer1_OnStop(object sender, MediaPlayerStopEventArgs e)
        {
            BeginInvoke(new StopDelegate(StopDelegateMethod), null);
        }

        private delegate void StopDelegate();

        private void StopDelegateMethod()
        {
            tbTimeline.Value = 0;
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            timer1.Tag = 1;
            tbTimeline.Maximum = (int)(MediaPlayer1.Duration_Time() / 1000.0);

            int value = (int)(MediaPlayer1.Position_Get_Time() / 1000.0);
            if ((value > 0) && (value < tbTimeline.Maximum))
            {
                tbTimeline.Value = value;
            }

            lbTime.Text = MediaPlayer.Helpful_SecondsToTimeFormatted(tbTimeline.Value) + "/" + MediaPlayer.Helpful_SecondsToTimeFormatted(tbTimeline.Maximum);

            timer1.Tag = 0;
        }

        private void tbTimeline_Scroll(object sender, EventArgs e)
        {
            if (Convert.ToInt32(timer1.Tag) == 0)
            {
                MediaPlayer1.Position_Set_Time(tbTimeline.Value * 1000);
            }
        }

        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
            if (MediaPlayer1.Status != VFMediaPlayerStatus.Free)
            {
                MediaPlayer1.Stop();
            }
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (openFileDialog1.ShowDialog() == DialogResult.OK)
            {
                edPanicImage.Text = openFileDialog1.FileName;
                setMediaPlayerBgImage();
            }
        }

        private void setMediaPlayerBgImage()
        {
            MediaPlayer1.BackgroundImage = Image.FromFile(edPanicImage.Text);
        }

        private void lvFiles_DragOver(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Link;
        }

        private void lvFiles_DragDrop(object sender, DragEventArgs e)
        {
            string[] filenames = (string[]) e.Data.GetData(DataFormats.FileDrop);
            foreach (var filename in filenames)
            {
                var info = new PIPInfo();

                var f = Path.GetFileNameWithoutExtension(filename);
                _imageList.Images.Add(f, GetThumbnail(filename, Path.Combine(System.Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), "AGLightThumbnails", f + ".png")));
                MediaPlayer1.PIP_Sources_Add(filename, 0, 0, 0, 0);
                lvFiles.Items.Add(f, f);
                info.Rect = new Rectangle(0, 0, 0, 0);

                info.Alpha = tbStreamTransparency.Value / 100.0f;
           

                info.Filename = filename;
                info.ZOrder = _lastZOrder--;

                _pipInfos.Add(info);

                //lbSourceFiles.SelectedIndex = _pipInfos.Count - 1;
            }
        }
    }
}
